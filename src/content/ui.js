(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	function formatSeconds(totalSeconds) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	function formatResetCountdown(timestampMs) {
		const diffMs = timestampMs - Date.now();
		if (diffMs <= 0) return '0s';

		const totalSeconds = Math.floor(diffMs / 1000);
		if (totalSeconds < 60) return `${totalSeconds}s`;

		const totalMinutes = Math.round(totalSeconds / 60);
		if (totalMinutes < 60) return `${totalMinutes}m`;

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		if (hours < 24) return `${hours}h ${minutes}m`;

		const days = Math.floor(hours / 24);
		const remHours = hours % 24;
		return `${days}d ${remHours}h`;
	}

	function setupTooltip(element, tooltip, { topOffset = 10 } = {}) {
		if (!element || !tooltip) return;
		if (element.hasAttribute('data-tooltip-setup')) return;
		element.setAttribute('data-tooltip-setup', 'true');
		element.classList.add('cc-tooltipTrigger');

		const show = () => {
			const rect = element.getBoundingClientRect();
			tooltip.style.opacity = '1';
			const tipRect = tooltip.getBoundingClientRect();

			let left = rect.left + rect.width / 2;
			if (left + tipRect.width / 2 > window.innerWidth) left = window.innerWidth - tipRect.width / 2 - 10;
			if (left - tipRect.width / 2 < 0) left = tipRect.width / 2 + 10;

			let top = rect.top - tipRect.height - topOffset;
			if (top < 10) top = rect.bottom + 10;

			tooltip.style.left = `${left}px`;
			tooltip.style.top = `${top}px`;
			tooltip.style.transform = 'translateX(-50%)';
		};

		const hide = () => {
			tooltip.style.opacity = '0';
		};

		element.addEventListener('pointerenter', (e) => {
			if (e.pointerType === 'mouse') show();
		});
		element.addEventListener('pointerleave', (e) => {
			if (e.pointerType === 'mouse') hide();
		});
	}

	function makeTooltip(text) {
		const tip = document.createElement('div');
		tip.className = 'cc-tooltip';
		tip.textContent = text;
		document.body.appendChild(tip);
		return tip;
	}

	class CounterUI {
		constructor({ onUsageRefresh } = {}) {
			this.onUsageRefresh = onUsageRefresh || null;

			// Top Header (Tokens & Cache)
			this.headerContainer = null;
			this.headerDisplay = null;
			this.lengthGroup = null;
			this.lengthDisplay = null;
			this.cachedDisplay = null;
			this.lengthBar = null;
			this.lengthTooltip = null;
			this.lastCachedUntilMs = null;
			this.pendingCache = false;

			// Top Usage Row
			this.usageLine = null;
			this.sessionUsageSpan = null;
			this.weeklyUsageSpan = null;
			this.sessionBar = null;
			this.sessionBarFill = null;
			this.weeklyBar = null;
			this.weeklyBarFill = null;
			this.sessionResetMs = null;
			this.weeklyResetMs = null;

			// Cat Working Toggle Button
			this.catButton = null;

			// Side-Docked Telemetry HUD
			this.sideHud = null;
			this.activeTab = 'usage'; // 'usage' | 'stats' | 'context'
			this.hudOpen = false;

			// Current Session Data State
			this.currentTokens = 0;
			this.sessionUtilization = 0.28;
			this.sessionLimitMax = 2000;
			this.sessionTokensUsed = 560;
			this.modelName = 'Claude 3.7 Sonnet';

			this.domObserver = null;
		}

		initialize() {
			this._initHeader();
			this._initUsageLine();
			this._initCatButton();
			this._initSideHud();

			this._setupTooltips();
			this._observeDom();
		}

		_initHeader() {
			this.headerContainer = document.createElement('div');
			this.headerContainer.className = 'text-text-500 text-xs !px-1 cc-header';

			this.headerDisplay = document.createElement('span');
			this.headerDisplay.className = 'cc-headerItem';

			this.lengthGroup = document.createElement('span');
			this.lengthDisplay = document.createElement('span');
			this.cachedDisplay = document.createElement('span');
			this.cacheTimeSpan = null;

			this.lengthGroup.appendChild(this.lengthDisplay);
			this.headerDisplay.appendChild(this.lengthGroup);
		}

		_initUsageLine() {
			this.usageLine = document.createElement('div');
			this.usageLine.className =
				'text-text-400 text-[11px] cc-usageRow cc-hidden flex flex-row items-center gap-3 w-full';

			this.sessionUsageSpan = document.createElement('span');
			this.sessionUsageSpan.className = 'cc-usageText';

			this.sessionBar = document.createElement('div');
			this.sessionBar.className = 'cc-bar cc-bar--usage';
			this.sessionBarFill = document.createElement('div');
			this.sessionBarFill.className = 'cc-bar__fill';
			this.sessionBar.appendChild(this.sessionBarFill);

			this.weeklyUsageSpan = document.createElement('span');
			this.weeklyUsageSpan.className = 'cc-usageText';

			this.weeklyBar = document.createElement('div');
			this.weeklyBar.className = 'cc-bar cc-bar--usage';
			this.weeklyBarFill = document.createElement('div');
			this.weeklyBarFill.className = 'cc-bar__fill';
			this.weeklyBar.appendChild(this.weeklyBarFill);

			this.usageLine.addEventListener('click', () => this.toggleSideHud('usage'));
		}

		_initCatButton() {
			this.catButton = document.createElement('div');
			this.catButton.className = 'cc-cat-toggle-btn';
			this.catButton.title = "Open Claude Telemetry & Token Counter";

			this.catButton.innerHTML = `
				<span class="cc-cat-icon" style="background-image: url('https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif');"></span>
				<span class="cc-cat-label">Telemetry</span>
				<span class="cc-cat-badge" id="cc-cat-badge">0k</span>
			`;

			this.catButton.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleSideHud();
			});
		}

		_initSideHud() {
			this.sideHud = document.createElement('div');
			this.sideHud.className = 'cc-side-hud cc-side-hud--usage';
			this.sideHud.id = 'cc-side-hud';

			this._renderHudContent();
			document.body.appendChild(this.sideHud);

			// Close on outside click
			document.addEventListener('click', (e) => {
				if (this.hudOpen && !this.sideHud.contains(e.target) && !this.catButton.contains(e.target)) {
					this.closeSideHud();
				}
			});
		}

		_renderHudContent() {
			const contextData = CC.tokens ? CC.tokens.computeContextBreakdown(this.currentTokens) : {
				sysPromptPct: '1.3',
				sysToolsPct: '8.8',
				messagesPct: '15.3',
				freeSpacePct: '74.6',
				usedPct: Math.round((this.currentTokens / 200000) * 100)
			};

			const resetStr = this.sessionResetMs ? formatResetCountdown(this.sessionResetMs) : '3h 42m';
			const usedTokensFmt = Math.round(this.currentTokens / 1000) + 'k';
			const limitFmt = (CC.CONST.CONTEXT_LIMIT_TOKENS / 1000) + 'k';

			this.sideHud.className = `cc-side-hud cc-side-hud--${this.activeTab} ${this.hudOpen ? 'cc-open' : ''}`;

			let titleHtml = '';
			let subtitleHtml = '';
			let bodyHtml = '';

			if (this.activeTab === 'usage') {
				titleHtml = `<span>/usage</span>`;
				subtitleHtml = `Plan limits & rate limit status`;
				bodyHtml = `
					<div class="cc-metric-row">
						<span class="cc-metric-label">Plan</span>
						<span class="cc-metric-value" style="color: var(--cc-amber);">Pro / Max</span>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Rate limit</span>
						<span class="cc-metric-value">${(Math.round(this.sessionUtilization * 2000)).toLocaleString()} / 2,000</span>
					</div>
					<div class="cc-meter-wrap">
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--orange" style="width: ${Math.round(this.sessionUtilization * 100)}%;"></div>
						</div>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Resets in</span>
						<span class="cc-metric-value">${resetStr}</span>
					</div>
					<div class="cc-catchphrase">"Can I keep working?"</div>
				`;
			} else if (this.activeTab === 'stats') {
				titleHtml = `<span>/stats</span>`;
				subtitleHtml = `Heatmap, sessions, models, streaks`;
				bodyHtml = `
					<div class="cc-heatmap-wrap">
						<div class="cc-heatmap-grid">
							<div class="cc-heatmap-day">Mon</div>
							<div class="cc-heatmap-cell cc-heatmap-cell--1"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--3"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--1"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--2"></div>

							<div class="cc-heatmap-day">Wed</div>
							<div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--1"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--3"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--3"></div>

							<div class="cc-heatmap-day">Fri</div>
							<div class="cc-heatmap-cell cc-heatmap-cell--3"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--1"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--3"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--4"></div>
							<div class="cc-heatmap-cell cc-heatmap-cell--2"></div>
						</div>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Sessions</span>
						<span class="cc-metric-value">92</span>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Total tokens</span>
						<span class="cc-metric-value">10.5m</span>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Longest streak</span>
						<span class="cc-metric-value">56 days</span>
					</div>
					<div class="cc-metric-row">
						<span class="cc-metric-label">Favorite model</span>
						<span class="cc-metric-value" style="color: var(--cc-purple);">${this.modelName}</span>
					</div>
					<div class="cc-catchphrase">"Where are my tokens going?"</div>
				`;
			} else if (this.activeTab === 'context') {
				titleHtml = `<span>/context</span>`;
				subtitleHtml = `Context window breakdown`;
				bodyHtml = `
					<div class="cc-part-row">
						<div class="cc-part-header">
							<span>System prompt</span>
							<span>${contextData.sysPromptPct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--cyan" style="width: ${contextData.sysPromptPct}%;"></div>
						</div>
					</div>
					<div class="cc-part-row">
						<div class="cc-part-header">
							<span>System tools / Memory</span>
							<span>${contextData.sysToolsPct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--cyan" style="width: ${contextData.sysToolsPct}%;"></div>
						</div>
					</div>
					<div class="cc-part-row">
						<div class="cc-part-header">
							<span>Messages</span>
							<span>${contextData.messagesPct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--cyan" style="width: ${contextData.messagesPct}%;"></div>
						</div>
					</div>
					<div class="cc-part-row">
						<div class="cc-part-header" style="color: var(--cc-green);">
							<span>Free space</span>
							<span>${contextData.freeSpacePct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--green" style="width: ${contextData.freeSpacePct}%;"></div>
						</div>
					</div>
					<div class="cc-catchphrase">"What's eating my context?"</div>
					<div style="text-align: center; font-size: 13px; font-weight: 700; color: #fff;">
						${usedTokensFmt} / ${limitFmt} tokens (${contextData.usedPct}%)
					</div>
				`;
			}

			this.sideHud.innerHTML = `
				<div class="cc-hud-top">
					<div class="cc-hud-title-wrap">
						<div class="cc-hud-title">${titleHtml}</div>
						<div class="cc-hud-subtitle">${subtitleHtml}</div>
					</div>
					<button class="cc-hud-close-btn" id="cc-hud-close" title="Close">✕</button>
				</div>

				<div class="cc-tab-bar">
					<button class="cc-tab-btn cc-tab-btn--usage ${this.activeTab === 'usage' ? 'cc-active' : ''}" data-tab="usage">Usage</button>
					<button class="cc-tab-btn cc-tab-btn--stats ${this.activeTab === 'stats' ? 'cc-active' : ''}" data-tab="stats">Stats</button>
					<button class="cc-tab-btn cc-tab-btn--context ${this.activeTab === 'context' ? 'cc-active' : ''}" data-tab="context">Context</button>
				</div>

				<div class="cc-hud-body">
					${bodyHtml}
				</div>

				<div class="cc-hud-footer">
					<div class="cc-cost-pill">
						<span>⚡ $0.00 Estimated Cost (Cache Active)</span>
					</div>
					<button class="cc-export-btn" id="cc-export-md-btn">
						<span>📥 Export Chat (Full Thinking &amp; Artifacts)</span>
					</button>
					<button class="cc-export-json-btn" id="cc-export-json-btn">
						Export Raw JSON
					</button>
				</div>
			`;

			// Wire Events
			this.sideHud.querySelector('#cc-hud-close').addEventListener('click', () => this.closeSideHud());

			this.sideHud.querySelectorAll('.cc-tab-btn').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					this.activeTab = e.target.getAttribute('data-tab');
					this._renderHudContent();
				});
			});

			this.sideHud.querySelector('#cc-export-md-btn').addEventListener('click', () => {
				if (CC.Exporter) CC.Exporter.exportToMarkdown();
			});

			this.sideHud.querySelector('#cc-export-json-btn').addEventListener('click', () => {
				if (CC.Exporter) CC.Exporter.exportToJson();
			});
		}

		toggleSideHud(tab = null) {
			if (tab) this.activeTab = tab;
			this.hudOpen = !this.hudOpen;
			this._renderHudContent();
		}

		openSideHud(tab = null) {
			if (tab) this.activeTab = tab;
			this.hudOpen = true;
			this._renderHudContent();
		}

		closeSideHud() {
			this.hudOpen = false;
			this.sideHud.classList.remove('cc-open');
		}

		_setupTooltips() {
			this.lengthTooltip = makeTooltip('0 tokens');
			setupTooltip(this.lengthDisplay, this.lengthTooltip);
		}

		_observeDom() {
			let catAttachPending = false;

			this.domObserver = new MutationObserver(() => {
				if (!document.contains(this.catButton) && !catAttachPending) {
					catAttachPending = true;
					this.attachCatButton();
					catAttachPending = false;
				}
			});
			this.domObserver.observe(document.body, { childList: true, subtree: true });
		}

		attachCatButton() {
			const inputContainer = document.querySelector(CC.DOM.CHAT_INPUT_CONTAINER) ||
				document.querySelector('fieldset') ||
				document.querySelector('form') ||
				document.querySelector('.chat-project-wrapper');

			if (inputContainer && !inputContainer.contains(this.catButton)) {
				inputContainer.appendChild(this.catButton);
			}
		}

		updateTokens(totalTokens) {
			this.currentTokens = totalTokens;
			const badge = document.getElementById('cc-cat-badge');
			if (badge) {
				badge.textContent = Math.round(totalTokens / 1000) + 'k';
			}
			if (this.hudOpen) this._renderHudContent();
		}

		updateUsage({ sessionUtilization, sessionResetMs, weeklyUtilization, weeklyResetMs }) {
			if (typeof sessionUtilization === 'number') this.sessionUtilization = sessionUtilization;
			if (sessionResetMs) this.sessionResetMs = sessionResetMs;
			if (this.hudOpen) this._renderHudContent();
		}
	}

	CC.UI = CounterUI;
})();
