(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	const ROOT_MESSAGE_ID = '00000000-0000-4000-8000-000000000000';

	function stableStringify(value) {
		const seen = new WeakSet();

		const normalize = (v) => {
			if (v === null || typeof v !== 'object') return v;
			if (seen.has(v)) return '[Circular]';
			seen.add(v);

			if (Array.isArray(v)) return v.map(normalize);

			const out = {};
			for (const key of Object.keys(v).sort()) {
				out[key] = normalize(v[key]);
			}
			return out;
		};

		try {
			return JSON.stringify(normalize(value));
		} catch {
			return '';
		}
	}

	function getTokenizer() {
		return globalThis.GPTTokenizer_o200k_base || null;
	}

	function countTokens(text) {
		if (!text) return 0;
		const tokenizer = getTokenizer();
		if (!tokenizer?.countTokens) {
			// Fallback: estimate 1 token ≈ 4 characters
			return Math.ceil(text.length / 4);
		}
		try {
			return tokenizer.countTokens(text);
		} catch {
			return Math.ceil(text.length / 4);
		}
	}

	function buildTrunk(conversation) {
		const messages = Array.isArray(conversation?.chat_messages) ? conversation.chat_messages : [];
		const byId = new Map();
		for (const msg of messages) {
			if (msg?.uuid) byId.set(msg.uuid, msg);
		}

		const leaf = conversation?.current_leaf_message_uuid;
		if (!leaf) return [];

		const trunk = [];
		let currentId = leaf;
		while (currentId && currentId !== ROOT_MESSAGE_ID) {
			const msg = byId.get(currentId);
			if (!msg) break;
			trunk.push(msg);
			currentId = msg.parent_message_uuid;
		}

		trunk.reverse();
		return trunk;
	}

	function isCountableContentItem(item) {
		if (!item || typeof item !== 'object') return false;
		if (typeof item.type !== 'string') return false;
		if (item.type === 'thinking' || item.type === 'redacted_thinking') return false;
		if (item.type === 'image' || item.type === 'document') return false;
		return true;
	}

	function stringifyCountableContentItem(item) {
		if (!isCountableContentItem(item)) return '';

		if (item.type === 'text' && typeof item.text === 'string') return item.text;

		if (item.type === 'tool_use') {
			const minimal = { id: item.id, name: item.name, input: item.input };
			return stableStringify(minimal);
		}

		if (item.type === 'tool_result') {
			const minimal = { tool_use_id: item.tool_use_id, is_error: item.is_error, content: item.content };
			return stableStringify(minimal);
		}

		const minimal = {};
		if (typeof item.text === 'string') minimal.text = item.text;
		if (typeof item.title === 'string') minimal.title = item.title;
		if (typeof item.url === 'string') minimal.url = item.url;
		if (typeof item.content === 'string') minimal.content = item.content;
		if (Array.isArray(item.content)) minimal.content = item.content;
		if (Object.keys(minimal).length === 0) return '';
		return stableStringify(minimal);
	}

	function stringifyMessageCountables(message) {
		const parts = [];
		const content = Array.isArray(message?.content) ? message.content : [];
		for (const item of content) {
			const s = stringifyCountableContentItem(item);
			if (s) parts.push(s);
		}

		const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
		for (const a of attachments) {
			if (typeof a?.extracted_content === 'string' && a.extracted_content) {
				parts.push(a.extracted_content);
			}
		}

		return parts.join('\n');
	}

	async function hashString(str) {
		if (!CC.bridge?.requestHash) return null;
		try {
			const res = await CC.bridge.requestHash(str);
			if (res?.hash) return res.hash;
		} catch {}
		return null;
	}

	async function fingerprint(text) {
		if (!text) return null;
		const hash = await hashString(text);
		if (!hash) return null;
		return `${text.length}:${hash}`;
	}

	class TokenCache {
		constructor() {
			this._byMessageId = new Map();
		}

		async getMessageTokens(messageId, messageText) {
			const fp = await fingerprint(messageText);
			if (!fp) return countTokens(messageText);
			const cached = this._byMessageId.get(messageId);
			if (cached && cached.fp === fp) return cached.tokens;

			const tokens = countTokens(messageText);
			this._byMessageId.set(messageId, { fp, tokens });
			return tokens;
		}

		pruneToMessageIds(keepIds) {
			const keep = new Set(keepIds);
			for (const id of this._byMessageId.keys()) {
				if (!keep.has(id)) this._byMessageId.delete(id);
			}
		}
	}

	const tokenCache = new TokenCache();

	async function computeConversationMetrics(conversation) {
		const trunk = buildTrunk(conversation);
		const trunkIds = trunk.map((m) => m.uuid).filter(Boolean);
		tokenCache.pruneToMessageIds(trunkIds);

		let totalTokens = 0;
		let inputTokens = 0;
		let outputTokens = 0;
		let lastAssistantMs = null;

		for (const msg of trunk) {
			const isAssistant = msg?.sender === 'assistant';
			if (isAssistant && msg?.created_at) {
				const msgMs = Date.parse(msg.created_at);
				if (!lastAssistantMs || msgMs > lastAssistantMs) {
					lastAssistantMs = msgMs;
				}
			}

			const msgText = stringifyMessageCountables(msg);
			const msgTokens = msg?.uuid ? await tokenCache.getMessageTokens(msg.uuid, msgText) : countTokens(msgText);
			
			if (isAssistant) {
				outputTokens += msgTokens;
			} else {
				inputTokens += msgTokens;
			}
			totalTokens += msgTokens;
		}

		const cachedUntil = lastAssistantMs ? lastAssistantMs + CC.CONST.CACHE_WINDOW_MS : null;
		const isCached = cachedUntil ? Date.now() < cachedUntil : false;

		// Estimated Cache Hit tokens
		const cacheReadTokens = isCached ? Math.max(0, inputTokens - 500) : 0;
		const cacheWriteTokens = !isCached ? inputTokens : 0;

		return {
			trunkMessageCount: trunk.length,
			totalTokens,
			inputTokens,
			outputTokens,
			cacheReadTokens,
			cacheWriteTokens,
			lastAssistantMs,
			cachedUntil,
			isCached
		};
	}

	/**
	 * Compute dollar cost and savings via prompt caching
	 */
	function computeCostAndSavings(metrics, modelKey = 'claude-3-7-sonnet') {
		const pricing = CC.PRICING[modelKey] || CC.PRICING['claude-3-7-sonnet'];
		
		const baseInputCost = (metrics.inputTokens / 1_000_000) * pricing.input;
		const outputCost = (metrics.outputTokens / 1_000_000) * pricing.output;
		
		// If cache read applies: 90% discount on cache read tokens
		const cacheReadCost = (metrics.cacheReadTokens / 1_000_000) * pricing.cacheRead;
		const freshInputTokens = Math.max(0, metrics.inputTokens - metrics.cacheReadTokens);
		const freshInputCost = (freshInputTokens / 1_000_000) * pricing.input;

		const actualCost = freshInputCost + cacheReadCost + outputCost;
		const unoptimizedCost = baseInputCost + outputCost;
		const savings = Math.max(0, unoptimizedCost - actualCost);

		return {
			actualCost: actualCost.toFixed(4),
			savings: savings.toFixed(4),
			modelName: pricing.name
		};
	}

	/**
	 * Compute partition percentages for the /context breakdown
	 */
	function computeContextBreakdown(totalTokens, limit = CC.CONST.CONTEXT_LIMIT_TOKENS) {
		const sysPromptTokens = Math.min(2600, Math.floor(totalTokens * 0.05));
		const sysToolsTokens = Math.min(18000, Math.floor(totalTokens * 0.15));
		const messageTokens = Math.max(0, totalTokens - sysPromptTokens - sysToolsTokens);
		const freeTokens = Math.max(0, limit - totalTokens);

		return {
			sysPromptPct: ((sysPromptTokens / limit) * 100).toFixed(1),
			sysToolsPct: ((sysToolsTokens / limit) * 100).toFixed(1),
			messagesPct: ((messageTokens / limit) * 100).toFixed(1),
			freeSpacePct: ((freeTokens / limit) * 100).toFixed(1),
			totalTokens,
			limit,
			usedPct: Math.min(100, Math.round((totalTokens / limit) * 100))
		};
	}

	CC.tokens = {
		buildTrunk,
		computeConversationMetrics,
		computeCostAndSavings,
		computeContextBreakdown,
		countTokens
	};
})();
