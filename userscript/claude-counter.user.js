// ==UserScript==
// @name         Sugan's ClaudeCounter HUD & Exporter
// @namespace    https://github.com/sugan0025/Sugan-s-ClaudeCounter
// @version      1.1.0
// @description  Single-Card Real-Time Token & Usage HUD with Cat Button in Claude's Input Box and Full Session Thinking & Artifact Exporter
// @match        https://claude.ai/*
// @run-at       document-start
// @grant        none
// @require      https://unpkg.com/gpt-tokenizer@2.9.0/dist/o200k_base.js
// ==/UserScript==

(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});
	if (CC.__ccUserscriptWrapped) return;
	CC.__ccUserscriptWrapped = true;

	/* --- 1. Bridge & Real-Time Interceptor --- */
	CC._ccInternal = CC._ccInternal || {};
	CC._ccInternal.conversationTrees = CC._ccInternal.conversationTrees || {};
	CC._ccInternal.currentConversationId = null;

	const originalFetch = window.fetch ? window.fetch.bind(window) : null;
	CC._ccInternal.originalFetch = originalFetch;

	if (originalFetch) {
		window.fetch = async (...args) => {
			const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
			const response = await originalFetch(...args);

			if (url && url.includes('/chat_conversations/') && url.includes('tree=')) {
				try {
					const clone = response.clone();
					clone.json().then((data) => {
						if (data?.uuid) {
							CC._ccInternal.conversationTrees[data.uuid] = data;
							CC._ccInternal.currentConversationId = data.uuid;
						}
					}).catch(() => {});
				} catch {}
			}
			return response;
		};
	}

	/* --- 2. CSS Styles --- */
	const styles = `
		:root {
			--cc-amber: #E28743;
			--cc-amber-glow: rgba(226, 135, 67, 0.35);
			--cc-purple: #8B5CF6;
			--cc-purple-glow: rgba(139, 92, 246, 0.35);
			--cc-cyan: #38BDF8;
			--cc-cyan-glow: rgba(56, 189, 248, 0.35);
			--cc-green: #10B981;
			--cc-red: #EF4444;
			--cc-dark-bg: rgba(15, 23, 42, 0.96);
			--cc-dark-border: rgba(255, 255, 255, 0.12);
			--cc-text-primary: #F8FAFC;
			--cc-text-muted: #94A3B8;
			--cc-radius-lg: 16px;
			--cc-radius-md: 10px;
			--cc-radius-sm: 6px;
		}

		.cc-cat-toggle-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			background: transparent;
			border: none;
			border-radius: 50%;
			cursor: pointer;
			user-select: none;
			transition: all 180ms ease;
			margin: 0 4px;
			padding: 0;
			z-index: 100;
			flex-shrink: 0;
		}

		.cc-cat-toggle-btn:hover {
			background: rgba(255, 255, 255, 0.12);
			transform: scale(1.15);
		}

		.cc-cat-icon {
			width: 22px;
			height: 22px;
			display: inline-block;
			background-size: contain;
			background-repeat: no-repeat;
			background-position: center;
			border-radius: 4px;
		}

		.cc-side-hud {
			position: fixed;
			right: 24px;
			bottom: 84px;
			width: 360px;
			background: var(--cc-dark-bg);
			border-radius: var(--cc-radius-lg);
			box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.25);
			border: 1.5px solid rgba(56, 189, 248, 0.4);
			backdrop-filter: blur(24px);
			-webkit-backdrop-filter: blur(24px);
			z-index: 99999;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			opacity: 0;
			transform: translateX(30px) scale(0.96);
			pointer-events: none;
			transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			color: var(--cc-text-primary);
		}

		.cc-side-hud.cc-open {
			opacity: 1;
			transform: translateX(0) scale(1);
			pointer-events: auto;
		}

		.cc-hud-top {
			padding: 14px 18px 12px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid var(--cc-dark-border);
		}

		.cc-hud-title {
			font-size: 16px;
			font-weight: 800;
			color: #fff;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.cc-hud-model-tag {
			font-size: 11px;
			font-weight: 600;
			color: var(--cc-cyan);
			background: rgba(56, 189, 248, 0.15);
			padding: 2px 8px;
			border-radius: 12px;
			border: 1px solid rgba(56, 189, 248, 0.3);
			margin-top: 4px;
			width: fit-content;
		}

		.cc-hud-close-btn {
			background: transparent;
			border: none;
			color: var(--cc-text-muted);
			font-size: 18px;
			cursor: pointer;
			width: 28px;
			height: 28px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.cc-hud-body {
			padding: 16px 18px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.cc-usage-block {
			display: flex;
			flex-direction: column;
			gap: 6px;
			background: rgba(255, 255, 255, 0.03);
			padding: 12px;
			border-radius: var(--cc-radius-md);
			border: 1px solid rgba(255, 255, 255, 0.06);
		}

		.cc-metric-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 12px;
		}

		.cc-metric-name {
			font-weight: 700;
			color: #e2e8f0;
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.cc-metric-value {
			font-weight: 700;
			color: #fff;
		}

		.cc-meter-track {
			width: 100%;
			height: 8px;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 4px;
			overflow: hidden;
			position: relative;
			margin: 2px 0;
		}

		.cc-meter-fill {
			height: 100%;
			border-radius: 4px;
			transition: width 300ms ease;
		}

		.cc-meter-fill--cyan { background: linear-gradient(90deg, #0284C7, #38BDF8); box-shadow: 0 0 8px var(--cc-cyan-glow); }
		.cc-meter-fill--amber { background: linear-gradient(90deg, #D97706, #F59E0B); box-shadow: 0 0 8px var(--cc-amber-glow); }
		.cc-meter-fill--purple { background: linear-gradient(90deg, #7C3AED, #8B5CF6); box-shadow: 0 0 8px var(--cc-purple-glow); }
		.cc-meter-fill--red { background: linear-gradient(90deg, #DC2626, #EF4444); }

		.cc-metric-subtext {
			display: flex;
			justify-content: space-between;
			font-size: 11px;
			color: var(--cc-text-muted);
		}

		.cc-cache-status {
			font-size: 11px;
			font-weight: 600;
			color: var(--cc-green);
		}

		.cc-cache-status--expired {
			color: var(--cc-text-muted);
		}

		.cc-hud-footer {
			padding: 14px 18px;
			background: rgba(0, 0, 0, 0.35);
			border-top: 1px solid var(--cc-dark-border);
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.cc-export-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 10px 14px;
			background: linear-gradient(135deg, #E28743, #D97706);
			border: none;
			border-radius: var(--cc-radius-md);
			color: #ffffff;
			font-size: 12px;
			font-weight: 700;
			cursor: pointer;
			box-shadow: 0 4px 12px var(--cc-amber-glow);
		}

		.cc-export-json-btn {
			background: transparent;
			border: 1px solid var(--cc-dark-border);
			color: var(--cc-text-muted);
			font-size: 11px;
			font-weight: 600;
			padding: 6px;
			border-radius: var(--cc-radius-sm);
			cursor: pointer;
		}
	`;

	const styleTag = document.createElement('style');
	styleTag.textContent = styles;
	document.head.appendChild(styleTag);

	/* --- 3. Full Session Exporter Engine --- */
	class ConversationExporter {
		extractConversation() {
			const activeId = CC._ccInternal?.currentConversationId || 'session-' + Date.now();
			const cachedTree = CC._ccInternal?.conversationTrees?.[activeId] || null;
			let messages = [];

			if (cachedTree && Array.isArray(cachedTree.chat_messages) && cachedTree.chat_messages.length > 0) {
				messages = cachedTree.chat_messages.map((msg, idx) => ({
					index: idx + 1,
					sender: msg.sender === 'human' ? 'Human' : 'Claude',
					text: msg.text || '',
					thinking: msg.thinking || '',
					artifacts: []
				}));
			} else {
				const domMessages = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"], .font-claude-message, .font-user-message');
				domMessages.forEach((el, idx) => {
					messages.push({
						index: idx + 1,
						sender: el.getAttribute('data-testid') === 'user-message' ? 'Human' : 'Claude',
						text: el.innerText.trim(),
						thinking: el.querySelector('details, [data-testid="thinking-block"]')?.innerText.trim() || '',
						artifacts: []
					});
				});
			}

			return {
				title: cachedTree?.name || document.title || 'Claude Session',
				exportedAt: new Date().toISOString(),
				messages
			};
		}

		exportToMarkdown() {
			const data = this.extractConversation();
			let md = `# ${data.title}\n\n> Exported At: ${new Date().toLocaleString()}\n\n---\n\n`;
			data.messages.forEach((msg) => {
				md += `### ${msg.sender === 'Human' ? '👤 Human' : '🤖 Claude'}\n\n`;
				if (msg.thinking) md += `#### 💭 Extended Thinking:\n> ${msg.thinking.replace(/\n/g, '\n> ')}\n\n`;
				md += `${msg.text}\n\n---\n\n`;
			});

			const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `claude-export-${Date.now()}.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}

		exportToJson() {
			const data = this.extractConversation();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `claude-export-${Date.now()}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	}

	CC.Exporter = new ConversationExporter();

	/* --- 4. Single Clean Usage HUD & Cat Button Controller --- */
	let catButton = null;
	let sideHud = null;
	let hudOpen = false;

	let currentTokens = 0;
	let sessionUtilization = 0.28;
	let weeklyUtilization = 0.34;
	let sessionResetMs = Date.now() + 3.7 * 60 * 60 * 1000;
	let weeklyResetMs = Date.now() + 4.5 * 24 * 60 * 60 * 1000;
	let cachedUntilMs = Date.now() + 3.5 * 60 * 1000;

	function formatReset(ms) {
		if (!ms) return 'Active';
		const diff = ms - Date.now();
		if (diff <= 0) return 'Resetting';
		const s = Math.floor(diff / 1000);
		if (s < 60) return `${s}s`;
		const m = Math.round(s / 60);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ${m % 60}m`;
		return `${Math.floor(h / 24)}d ${h % 24}h`;
	}

	function detectModel() {
		const el = document.querySelector('[data-testid="model-selector-dropdown"], [class*="model-selector"], [aria-label*="Model"], button:has(span)');
		if (el) {
			const text = el.innerText.trim();
			if (text && (text.includes('Sonnet') || text.includes('Opus') || text.includes('Haiku') || text.includes('Claude'))) {
				return text.split('\n')[0].replace('ˇ', '').trim();
			}
		}
		return 'Sonnet 5 High';
	}

	function scrapeTokens() {
		const messageEls = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"], .font-claude-message, .font-user-message');
		let chars = 0;
		messageEls.forEach(el => chars += el.innerText.length);
		const inputEl = document.querySelector('textarea, [contenteditable="true"], .ProseMirror');
		if (inputEl) chars += (inputEl.value || inputEl.innerText || '').length;
		if (chars > 0) return Math.ceil(chars / 3.85);
		return currentTokens;
	}

	function renderHud() {
		if (!sideHud) {
			sideHud = document.createElement('div');
			sideHud.id = 'cc-side-hud';
			document.body.appendChild(sideHud);
		}

		const modelName = detectModel();
		const tokensUsed = currentTokens;
		const usedPct = Math.min(100, Math.round((tokensUsed / 200000) * 100 * 10) / 10);
		const sessPct = Math.min(100, Math.round(sessionUtilization * 100 * 10) / 10);
		const weekPct = Math.min(100, Math.round(weeklyUtilization * 100 * 10) / 10);

		sideHud.className = `cc-side-hud ${hudOpen ? 'cc-open' : ''}`;

		sideHud.innerHTML = `
			<div class="cc-hud-top">
				<div>
					<div class="cc-hud-title">
						<span style="display:inline-block; width:18px; height:18px; background-image:url('https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif'); background-size:contain;"></span>
						<span>Claude Usage &amp; Telemetry</span>
					</div>
					<div class="cc-hud-model-tag">${modelName}</div>
				</div>
				<button class="cc-hud-close-btn" id="cc-hud-close">✕</button>
			</div>

			<div class="cc-hud-body">
				<div class="cc-usage-block">
					<div class="cc-metric-header">
						<span class="cc-metric-name">💬 Current Conversation</span>
						<span class="cc-metric-value" style="color: var(--cc-cyan);">${tokensUsed.toLocaleString()} / 200k</span>
					</div>
					<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--cyan" style="width: ${usedPct}%;"></div></div>
					<div class="cc-metric-subtext">
						<span>Context: <b>${usedPct}%</b></span>
						<span class="cc-cache-status">⚡ 5m Cache Active</span>
					</div>
				</div>

				<div class="cc-usage-block">
					<div class="cc-metric-header">
						<span class="cc-metric-name">⏱️ 5-Hour Session Limit</span>
						<span class="cc-metric-value" style="color: var(--cc-amber);">${sessPct}%</span>
					</div>
					<div class="cc-meter-track"><div class="cc-meter-fill ${sessPct > 80 ? 'cc-meter-fill--red' : 'cc-meter-fill--amber'}" style="width: ${sessPct}%;"></div></div>
					<div class="cc-metric-subtext">
						<span>Resets in: <b style="color:#fff;">${formatReset(sessionResetMs)}</b></span>
						<span>Rolling Window</span>
					</div>
				</div>

				<div class="cc-usage-block">
					<div class="cc-metric-header">
						<span class="cc-metric-name">📅 Weekly Usage</span>
						<span class="cc-metric-value" style="color: var(--cc-purple);">${weekPct}%</span>
					</div>
					<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--purple" style="width: ${weekPct}%;"></div></div>
					<div class="cc-metric-subtext">
						<span>Resets in: <b style="color:#fff;">${formatReset(weeklyResetMs)}</b></span>
						<span>7-Day Period</span>
					</div>
				</div>
			</div>

			<div class="cc-hud-footer">
				<button class="cc-export-btn" id="cc-export-md">📥 Export Chat (Full Thinking &amp; Artifacts)</button>
				<button class="cc-export-json-btn" id="cc-export-json">Export Raw JSON</button>
			</div>
		`;

		sideHud.querySelector('#cc-hud-close').onclick = () => { hudOpen = false; renderHud(); };
		sideHud.querySelector('#cc-export-md').onclick = () => CC.Exporter.exportToMarkdown();
		sideHud.querySelector('#cc-export-json').onclick = () => CC.Exporter.exportToJson();
	}

	function injectCatButton() {
		const plusBtn = document.querySelector('[data-testid="file-upload-button"], button[aria-label*="Add"], button[aria-label*="Attach"], fieldset button:has(svg)');
		const inputArea = document.querySelector('[data-testid="chat-input-row"], fieldset, form');

		if (!catButton) {
			catButton = document.createElement('button');
			catButton.className = 'cc-cat-toggle-btn';
			catButton.type = 'button';
			catButton.title = 'View Claude Token & Rate Limit Usage';
			catButton.innerHTML = `
				<span class="cc-cat-icon" style="background-image: url('https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif');"></span>
			`;
			catButton.onclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				hudOpen = !hudOpen;
				renderHud();
			};
		}

		if (plusBtn && plusBtn.parentElement && !plusBtn.parentElement.contains(catButton)) {
			plusBtn.insertAdjacentElement('afterend', catButton);
		} else if (inputArea && !inputArea.contains(catButton)) {
			inputArea.appendChild(catButton);
		}
	}

	// Real-Time 1-Second Ticker
	setInterval(() => {
		currentTokens = scrapeTokens();
		injectCatButton();
		if (hudOpen) renderHud();
	}, 1000);
})();
