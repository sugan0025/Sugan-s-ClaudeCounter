(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	/**
	 * Extracts and exports Claude.ai conversations with full thinking chains,
	 * artifacts, code blocks, and telemetry metadata, even if token limits were reached mid-way.
	 */
	class ConversationExporter {
		constructor() {
			this.lastExportData = null;
		}

		/**
		 * Extracts raw conversation messages from memory, intercepted API response, or DOM fallback.
		 */
		extractConversation() {
			const activeConversationId = CC._ccInternal?.currentConversationId || this._getConversationIdFromUrl();
			const cachedTree = CC._ccInternal?.conversationTrees?.[activeConversationId] || null;

			let messages = [];

			if (cachedTree && Array.isArray(cachedTree.chat_messages) && cachedTree.chat_messages.length > 0) {
				messages = this._parseApiMessages(cachedTree.chat_messages);
			} else {
				// Fallback to scraping rendered DOM (handles ongoing or truncated sessions)
				messages = this._scrapeDomMessages();
			}

			const title = this._getConversationTitle(cachedTree);
			const tokenStats = CC._ccInternal?.currentTokens || {
				total: 0,
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0
			};

			const model = CC._ccInternal?.currentModel || 'Claude 3.7 Sonnet';

			return {
				id: activeConversationId,
				title: title || 'Claude Conversation',
				model,
				exportedAt: new Date().toISOString(),
				tokenStats,
				messages
			};
		}

		_getConversationIdFromUrl() {
			const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
			return match ? match[1] : 'session-' + Date.now();
		}

		_getConversationTitle(cachedTree) {
			if (cachedTree?.name) return cachedTree.name;
			if (cachedTree?.title) return cachedTree.title;

			const titleEl = document.querySelector('[data-testid="chat-title"]') || document.querySelector('header h1') || document.querySelector('title');
			if (titleEl) {
				const text = titleEl.textContent.replace(' - Claude', '').trim();
				if (text) return text;
			}
			return 'Claude Session';
		}

		_parseApiMessages(rawMessages) {
			return rawMessages.map((msg, index) => {
				const sender = msg.sender === 'human' ? 'Human' : 'Claude';
				let text = msg.text || '';
				let thinking = msg.thinking || '';
				let artifacts = [];

				// Check content array if structured
				if (Array.isArray(msg.content)) {
					for (const part of msg.content) {
						if (part.type === 'text') {
							text += (text ? '\n' : '') + part.text;
						} else if (part.type === 'thinking') {
							thinking += (thinking ? '\n' : '') + (part.thinking || part.text || '');
						} else if (part.type === 'tool_use' && part.name === 'artifacts') {
							artifacts.push({
								identifier: part.input?.id || `artifact-${index}`,
								title: part.input?.title || 'Generated Artifact',
								type: part.input?.type || 'code',
								content: part.input?.content || ''
							});
						}
					}
				}

				// Extract inline <thinking> tags if present in text
				if (!thinking && text.includes('<thinking>')) {
					const match = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
					if (match) {
						thinking = match[1].trim();
						text = text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
					}
				}

				// Extract inline <antArtifact> tags if present
				if (artifacts.length === 0 && text.includes('<antArtifact')) {
					const regex = /<antArtifact\s+identifier="([^"]*)"\s+type="([^"]*)"(?:\s+title="([^"]*)")?[^>]*>([\s\S]*?)<\/antArtifact>/g;
					let m;
					while ((m = regex.exec(text)) !== null) {
						artifacts.push({
							identifier: m[1] || `artifact-${artifacts.length + 1}`,
							type: m[2] || 'code',
							title: m[3] || 'Artifact',
							content: m[4] || ''
						});
					}
				}

				return {
					index: index + 1,
					sender,
					text,
					thinking,
					artifacts,
					createdAt: msg.created_at || new Date().toISOString(),
					truncated: msg.stop_reason === 'max_tokens' || Boolean(msg.truncated)
				};
			});
		}

		_scrapeDomMessages() {
			const messageEls = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"], .font-claude-message, .font-user-message');
			const messages = [];

			if (messageEls.length === 0) {
				// General fallback
				const turnContainers = document.querySelectorAll('[class*="ConversationItem"], [class*="chat-turn"]');
				turnContainers.forEach((turn, idx) => {
					const isHuman = turn.querySelector('[data-testid="user-message"]') || turn.textContent.includes('You:');
					messages.push({
						index: idx + 1,
						sender: isHuman ? 'Human' : 'Claude',
						text: turn.innerText.trim(),
						thinking: '',
						artifacts: [],
						createdAt: new Date().toISOString()
					});
				});
				return messages;
			}

			messageEls.forEach((el, idx) => {
				const isHuman = el.getAttribute('data-testid') === 'user-message' || el.classList.contains('font-user-message');
				
				// Extract Thinking blocks (often inside details or specialized thinking containers)
				let thinking = '';
				const thinkingEl = el.querySelector('[data-testid="thinking-block"], details, [class*="thinking"]');
				if (thinkingEl) {
					thinking = thinkingEl.innerText.trim();
				}

				// Extract Artifacts / Code snippets
				const artifacts = [];
				const artifactEls = el.querySelectorAll('[data-testid="artifact-button"], pre code, [class*="artifact"]');
				artifactEls.forEach((art, aIdx) => {
					artifacts.push({
						identifier: `artifact-${idx + 1}-${aIdx + 1}`,
						title: art.getAttribute('data-title') || art.getAttribute('data-artifact-title') || `Artifact ${aIdx + 1}`,
						type: art.getAttribute('data-type') || 'code',
						content: art.innerText.trim()
					});
				});

				// Clone text content without thinking block text
				let text = el.innerText.trim();
				if (thinking && text.includes(thinking)) {
					text = text.replace(thinking, '').trim();
				}

				messages.push({
					index: idx + 1,
					sender: isHuman ? 'Human' : 'Claude',
					text,
					thinking,
					artifacts,
					createdAt: new Date().toISOString()
				});
			});

			return messages;
		}

		/**
		 * Exports the extracted session to formatted Markdown (.md)
		 */
		exportToMarkdown() {
			const data = this.extractConversation();
			this.lastExportData = data;

			let md = `# ${data.title}\n\n`;
			md += `> **Model**: ${data.model}  \n`;
			md += `> **Exported At**: ${new Date(data.exportedAt).toLocaleString()}  \n`;
			md += `> **Total Tokens**: ${data.tokenStats.total.toLocaleString()} tokens  \n`;
			md += `> **Input**: ${data.tokenStats.input.toLocaleString()} | **Output**: ${data.tokenStats.output.toLocaleString()} | **Cache Read**: ${data.tokenStats.cacheRead.toLocaleString()}\n\n`;
			md += `---\n\n`;

			data.messages.forEach((msg) => {
				const isHuman = msg.sender === 'Human';
				md += `### ${isHuman ? '👤 Human' : '🤖 Claude'}\n\n`;

				if (msg.thinking) {
					md += `#### 💭 Extended Thinking Process:\n`;
					md += `> ${msg.thinking.replace(/\n/g, '\n> ')}\n\n`;
				}

				if (msg.text) {
					md += `${msg.text}\n\n`;
				}

				if (msg.artifacts && msg.artifacts.length > 0) {
					msg.artifacts.forEach((art, aIdx) => {
						md += `#### 📦 Artifact ${aIdx + 1}: ${art.title} (${art.type})\n`;
						md += `\`\`\`${art.type === 'code' ? 'javascript' : art.type}\n`;
						md += `${art.content}\n`;
						md += `\`\`\`\n\n`;
					});
				}

				if (msg.truncated) {
					md += `> ⚠️ *[Response truncated due to token limit]*\n\n`;
				}

				md += `---\n\n`;
			});

			this._triggerDownload(`${this._sanitizeFilename(data.title)}.md`, md, 'text/markdown');
			return data;
		}

		/**
		 * Exports the complete conversation tree with raw thinking & artifacts to JSON (.json)
		 */
		exportToJson() {
			const data = this.extractConversation();
			this.lastExportData = data;
			const jsonStr = JSON.stringify(data, null, 2);
			this._triggerDownload(`${this._sanitizeFilename(data.title)}.json`, jsonStr, 'application/json');
			return data;
		}

		_sanitizeFilename(title) {
			return (title || 'claude-session')
				.replace(/[^a-zA-Z0-9-_\s]/g, '')
				.trim()
				.replace(/\s+/g, '_')
				.substring(0, 50);
		}

		_triggerDownload(filename, content, mimeType) {
			const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
		}
	}

	CC.Exporter = new ConversationExporter();
})();
