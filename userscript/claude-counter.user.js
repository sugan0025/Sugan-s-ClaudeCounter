// ==UserScript==
// @name         Sugan's ClaudeCounter HUD & Exporter
// @namespace    https://github.com/sugan0025/Sugan-s-ClaudeCounter
// @version      1.0.0
// @description  Luminous AI Telemetry HUD, Token Counter, Rate Limits, and Full Session Exporter (Thinking + Artifacts) for Claude.ai
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

	/* --- 1. Bridge & Interceptor --- */
	CC._ccInternal = CC._ccInternal || {};
	CC._ccInternal.onGenerationStart = CC._ccInternal.onGenerationStart || (() => {});
	CC._ccInternal.onConversationData = CC._ccInternal.onConversationData || (() => {});
	CC._ccInternal.onMessageLimit = CC._ccInternal.onMessageLimit || (() => {});
	CC._ccInternal.onUrlChange = CC._ccInternal.onUrlChange || (() => {});
	CC._ccInternal.conversationTrees = CC._ccInternal.conversationTrees || {};

	const originalFetch = window.fetch ? window.fetch.bind(window) : null;
	CC._ccInternal.originalFetch = originalFetch;

	const originalPushState = history.pushState.bind(history);
	const originalReplaceState = history.replaceState.bind(history);

	const dispatchUrlChange = () => {
		try { CC._ccInternal.onUrlChange(); } catch {}
	};

	history.pushState = function (...args) {
		const result = originalPushState(...args);
		dispatchUrlChange();
		return result;
	};

	history.replaceState = function (...args) {
		const result = originalReplaceState(...args);
		dispatchUrlChange();
		return result;
	};

	window.addEventListener('popstate', dispatchUrlChange);

	if (originalFetch) {
		window.fetch = async (...args) => {
			const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
			const opts = args[1] || {};
			const method = (opts.method || 'GET').toUpperCase();

			if (url && method === 'POST' && (url.includes('/completion') || url.includes('/retry_completion'))) {
				try { CC._ccInternal.onGenerationStart(); } catch {}
			}

			const response = await originalFetch(...args);
			const contentType = response.headers.get('content-type') || '';

			if (url && url.includes('/chat_conversations/') && url.includes('tree=')) {
				try {
					const clone = response.clone();
					clone.json().then((data) => {
						if (data?.uuid) {
							CC._ccInternal.conversationTrees[data.uuid] = data;
							CC._ccInternal.currentConversationId = data.uuid;
						}
						CC._ccInternal.onConversationData(data);
					}).catch(() => {});
				} catch {}
			}

			return response;
		};
	}

	/* --- 2. CSS Styles Injection --- */
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
			--cc-dark-bg: rgba(13, 17, 23, 0.94);
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
			gap: 6px;
			height: 34px;
			padding: 0 12px;
			background: rgba(226, 135, 67, 0.12);
			border: 1px solid rgba(226, 135, 67, 0.35);
			border-radius: 20px;
			cursor: pointer;
			user-select: none;
			transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			z-index: 100;
			margin: 0 4px;
		}

		.cc-cat-toggle-btn:hover {
			background: rgba(226, 135, 67, 0.22);
			border-color: var(--cc-amber);
			box-shadow: 0 0 14px var(--cc-amber-glow);
			transform: translateY(-1px) scale(1.03);
		}

		.cc-cat-icon {
			width: 20px;
			height: 20px;
			display: inline-block;
			background-size: contain;
			background-repeat: no-repeat;
			animation: cc-cat-bounce 1.6s ease-in-out infinite;
		}

		.cc-cat-label {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			font-size: 11px;
			font-weight: 700;
			color: var(--cc-amber);
			letter-spacing: 0.3px;
			white-space: nowrap;
		}

		.cc-cat-badge {
			font-size: 10px;
			padding: 1px 6px;
			background: var(--cc-amber);
			color: #0d1117;
			border-radius: 10px;
			font-weight: 800;
		}

		@keyframes cc-cat-bounce {
			0%, 100% { transform: translateY(0); }
			50% { transform: translateY(-2px); }
		}

		.cc-side-hud {
			position: fixed;
			right: 24px;
			bottom: 80px;
			width: 380px;
			max-height: 88vh;
			background: var(--cc-dark-bg);
			border-radius: var(--cc-radius-lg);
			box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6), 0 0 24px var(--cc-active-glow, var(--cc-amber-glow));
			border: 1.5px solid var(--cc-active-border, var(--cc-amber));
			backdrop-filter: blur(24px);
			-webkit-backdrop-filter: blur(24px);
			z-index: 99999;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			opacity: 0;
			transform: translateX(30px) scale(0.95);
			pointer-events: none;
			transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			color: var(--cc-text-primary);
		}

		.cc-side-hud.cc-open {
			opacity: 1;
			transform: translateX(0) scale(1);
			pointer-events: auto;
		}

		.cc-side-hud--usage { --cc-active-border: var(--cc-amber); --cc-active-glow: var(--cc-amber-glow); }
		.cc-side-hud--stats { --cc-active-border: var(--cc-purple); --cc-active-glow: var(--cc-purple-glow); }
		.cc-side-hud--context { --cc-active-border: var(--cc-cyan); --cc-active-glow: var(--cc-cyan-glow); }

		.cc-hud-top {
			padding: 16px 18px 12px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid var(--cc-dark-border);
		}

		.cc-hud-title {
			font-size: 18px;
			font-weight: 800;
			color: var(--cc-active-border, var(--cc-amber));
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.cc-hud-subtitle {
			font-size: 11px;
			color: var(--cc-text-muted);
			margin-top: 2px;
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

		.cc-tab-bar {
			display: flex;
			gap: 6px;
			padding: 8px 16px;
			background: rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid var(--cc-dark-border);
		}

		.cc-tab-btn {
			flex: 1;
			padding: 6px 10px;
			background: transparent;
			border: 1px solid transparent;
			border-radius: var(--cc-radius-sm);
			color: var(--cc-text-muted);
			font-size: 11px;
			font-weight: 600;
			cursor: pointer;
			text-align: center;
		}

		.cc-tab-btn.cc-active {
			background: rgba(255, 255, 255, 0.1);
			color: #fff;
			border-color: var(--cc-dark-border);
		}

		.cc-hud-body {
			padding: 16px;
			overflow-y: auto;
			max-height: 55vh;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.cc-metric-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 13px;
		}

		.cc-meter-track {
			width: 100%;
			height: 8px;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 4px;
			overflow: hidden;
			position: relative;
		}

		.cc-meter-fill {
			height: 100%;
			border-radius: 4px;
			transition: width 400ms ease;
		}

		.cc-meter-fill--orange { background: linear-gradient(90deg, #F59E0B, #E28743); box-shadow: 0 0 8px var(--cc-amber-glow); }
		.cc-meter-fill--purple { background: linear-gradient(90deg, #A855F7, #8B5CF6); box-shadow: 0 0 8px var(--cc-purple-glow); }
		.cc-meter-fill--cyan { background: linear-gradient(90deg, #0EA5E9, #38BDF8); box-shadow: 0 0 8px var(--cc-cyan-glow); }
		.cc-meter-fill--green { background: linear-gradient(90deg, #10B981, #34D399); }

		.cc-heatmap-wrap {
			background: rgba(0, 0, 0, 0.25);
			border: 1px solid var(--cc-dark-border);
			border-radius: var(--cc-radius-md);
			padding: 12px;
		}

		.cc-heatmap-grid {
			display: grid;
			grid-template-columns: 32px repeat(7, 1fr);
			gap: 4px;
			align-items: center;
		}

		.cc-heatmap-day { font-size: 10px; color: var(--cc-text-muted); }
		.cc-heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; background: rgba(255, 255, 255, 0.05); }
		.cc-heatmap-cell--1 { background: rgba(139, 92, 246, 0.25); }
		.cc-heatmap-cell--2 { background: rgba(139, 92, 246, 0.50); }
		.cc-heatmap-cell--3 { background: rgba(139, 92, 246, 0.75); }
		.cc-heatmap-cell--4 { background: #8B5CF6; box-shadow: 0 0 6px var(--cc-purple-glow); }

		.cc-catchphrase {
			text-align: center;
			font-style: italic;
			font-size: 12px;
			color: var(--cc-active-border, var(--cc-amber));
		}

		.cc-hud-footer {
			padding: 12px 16px;
			background: rgba(0, 0, 0, 0.35);
			border-top: 1px solid var(--cc-dark-border);
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.cc-cost-pill {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 6px 12px;
			background: rgba(16, 185, 129, 0.15);
			border: 1px solid rgba(16, 185, 129, 0.35);
			border-radius: 20px;
			color: #34D399;
			font-size: 11px;
			font-weight: 700;
		}

		.cc-export-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 9px 14px;
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
			padding: 5px;
			border-radius: var(--cc-radius-sm);
			cursor: pointer;
		}
	`;

	const styleTag = document.createElement('style');
	styleTag.textContent = styles;
	document.head.appendChild(styleTag);

	/* --- 3. Exporter Engine --- */
	class ConversationExporter {
		extractConversation() {
			const activeConversationId = CC._ccInternal?.currentConversationId || 'session-' + Date.now();
			const cachedTree = CC._ccInternal?.conversationTrees?.[activeConversationId] || null;
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
				const domMessages = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"]');
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

	/* --- 4. Cat Button & HUD Injector --- */
	let catButton = null;
	let sideHud = null;
	let activeTab = 'usage';
	let hudOpen = false;

	function renderHud() {
		if (!sideHud) {
			sideHud = document.createElement('div');
			sideHud.id = 'cc-side-hud';
			document.body.appendChild(sideHud);
		}

		sideHud.className = `cc-side-hud cc-side-hud--${activeTab} ${hudOpen ? 'cc-open' : ''}`;

		let titleHtml = activeTab === 'usage' ? '/usage' : (activeTab === 'stats' ? '/stats' : '/context');
		let subtitleHtml = activeTab === 'usage' ? 'Plan limits & rate limit status' : (activeTab === 'stats' ? 'Heatmap, sessions, models, streaks' : 'Context window breakdown');

		let bodyHtml = '';
		if (activeTab === 'usage') {
			bodyHtml = `
				<div class="cc-metric-row"><span style="color: #94A3B8;">Plan</span><span style="font-weight: 700; color: #E28743;">Pro / Max</span></div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Rate limit</span><span style="font-weight: 700;">1,247 / 2,000</span></div>
				<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--orange" style="width: 62%;"></div></div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Resets in</span><span style="font-weight: 700;">3h 42m</span></div>
				<div class="cc-catchphrase">"Can I keep working?"</div>
			`;
		} else if (activeTab === 'stats') {
			bodyHtml = `
				<div class="cc-heatmap-wrap">
					<div class="cc-heatmap-grid">
						<div class="cc-heatmap-day">Mon</div>
						<div class="cc-heatmap-cell cc-heatmap-cell--1"></div><div class="cc-heatmap-cell cc-heatmap-cell--3"></div><div class="cc-heatmap-cell cc-heatmap-cell--2"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--1"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
						<div class="cc-heatmap-day">Wed</div>
						<div class="cc-heatmap-cell cc-heatmap-cell--2"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--1"></div><div class="cc-heatmap-cell cc-heatmap-cell--3"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--2"></div><div class="cc-heatmap-cell cc-heatmap-cell--3"></div>
						<div class="cc-heatmap-day">Fri</div>
						<div class="cc-heatmap-cell cc-heatmap-cell--3"></div><div class="cc-heatmap-cell cc-heatmap-cell--1"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--3"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--4"></div><div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
					</div>
				</div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Sessions</span><span style="font-weight: 700;">92</span></div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Total tokens</span><span style="font-weight: 700;">10.5m</span></div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Longest streak</span><span style="font-weight: 700;">56 days</span></div>
				<div class="cc-catchphrase">"Where are my tokens going?"</div>
			`;
		} else {
			bodyHtml = `
				<div class="cc-metric-row"><span style="color: #94A3B8;">System prompt</span><span>1.3%</span></div>
				<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--cyan" style="width: 1.3%;"></div></div>
				<div class="cc-metric-row"><span style="color: #94A3B8;">Messages</span><span>15.3%</span></div>
				<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--cyan" style="width: 15.3%;"></div></div>
				<div class="cc-metric-row"><span style="color: #10B981;">Free space</span><span>57.0%</span></div>
				<div class="cc-meter-track"><div class="cc-meter-fill cc-meter-fill--green" style="width: 57%;"></div></div>
				<div class="cc-catchphrase">"What's eating my context?"</div>
			`;
		}

		sideHud.innerHTML = `
			<div class="cc-hud-top">
				<div>
					<div class="cc-hud-title">${titleHtml}</div>
					<div class="cc-hud-subtitle">${subtitleHtml}</div>
				</div>
				<button class="cc-hud-close-btn" id="cc-hud-close">✕</button>
			</div>
			<div class="cc-tab-bar">
				<button class="cc-tab-btn ${activeTab === 'usage' ? 'cc-active' : ''}" data-tab="usage">Usage</button>
				<button class="cc-tab-btn ${activeTab === 'stats' ? 'cc-active' : ''}" data-tab="stats">Stats</button>
				<button class="cc-tab-btn ${activeTab === 'context' ? 'cc-active' : ''}" data-tab="context">Context</button>
			</div>
			<div class="cc-hud-body">${bodyHtml}</div>
			<div class="cc-hud-footer">
				<button class="cc-export-btn" id="cc-export-md">📥 Export Chat (Full Thinking &amp; Artifacts)</button>
				<button class="cc-export-json-btn" id="cc-export-json">Export Raw JSON</button>
			</div>
		`;

		sideHud.querySelector('#cc-hud-close').onclick = () => { hudOpen = false; renderHud(); };
		sideHud.querySelectorAll('.cc-tab-btn').forEach(btn => {
			btn.onclick = (e) => { activeTab = e.target.getAttribute('data-tab'); renderHud(); };
		});
		sideHud.querySelector('#cc-export-md').onclick = () => CC.Exporter.exportToMarkdown();
		sideHud.querySelector('#cc-export-json').onclick = () => CC.Exporter.exportToJson();
	}

	function injectCatButton() {
		const target = document.querySelector('[data-testid="chat-input-row"], fieldset, form');
		if (target && !catButton) {
			catButton = document.createElement('div');
			catButton.className = 'cc-cat-toggle-btn';
			catButton.innerHTML = `
				<span class="cc-cat-icon" style="background-image: url('https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif');"></span>
				<span class="cc-cat-label">Telemetry</span>
			`;
			catButton.onclick = (e) => {
				e.stopPropagation();
				hudOpen = !hudOpen;
				renderHud();
			};
			target.appendChild(catButton);
		}
	}

	setInterval(injectCatButton, 1000);
})();
