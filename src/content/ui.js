(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	function formatSeconds(totalSeconds) {
		if (totalSeconds <= 0) return '0s';
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
	}

	function formatResetCountdown(timestampMs) {
		if (!timestampMs) return 'Active';
		const diffMs = timestampMs - Date.now();
		if (diffMs <= 0) return 'Resetting now';

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

	class CounterUI {
		constructor({ onUsageRefresh } = {}) {
			this.onUsageRefresh = onUsageRefresh || null;

			// Cat Button (In Input Box next to +)
			this.catButton = null;

			// Single Unified Usage HUD
			this.sideHud = null;
			this.hudOpen = false;

			// Telemetry Live State
			this.currentTokens = 0;
			this.sessionUtilization = 0.28;
			this.weeklyUtilization = 0.34;
			this.sessionResetMs = Date.now() + 3.7 * 60 * 60 * 1000;
			this.weeklyResetMs = Date.now() + 4.5 * 24 * 60 * 60 * 1000;
			this.lastAssistantMs = null;
			this.cachedUntilMs = null;
			this.modelName = 'Sonnet 5 High';

			this.tickerInterval = null;
			this.domObserver = null;
			this.typingTimeout = null;
		}

		initialize() {
			this._initCatButton();
			this._initSideHud();
			this._startRealTimeTicker();
			this._observeDom();
		}

		_initCatButton() {
			this.catButton = document.createElement('button');
			this.catButton.className = 'cc-cat-toggle-btn cc-cat-idle';
			this.catButton.type = 'button';
			this.catButton.title = 'Claude Live Token & Rate Limit Usage';

			this.catButton.innerHTML = `
				<span class="cc-cat-icon"></span>
			`;

			this.catButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.toggleSideHud();
			});

			this._setupActivityListeners();
		}

		setCatActive(durationMs = 2500) {
			if (!this.catButton) return;
			this.catButton.classList.remove('cc-cat-idle');
			this.catButton.classList.add('cc-cat-active');

			if (this.typingTimeout) clearTimeout(this.typingTimeout);
			this.typingTimeout = setTimeout(() => {
				this.setCatIdle();
			}, durationMs);
		}

		setCatIdle() {
			if (!this.catButton) return;
			this.catButton.classList.remove('cc-cat-active');
			this.catButton.classList.add('cc-cat-idle');
		}

		_setupActivityListeners() {
			// Detect user typing in prompt box / textarea
			const handleInputActivity = (e) => {
				const target = e.target;
				if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable || target.classList?.contains('ProseMirror') || target.tagName === 'INPUT')) {
					this.setCatActive(2500);
				}
			};

			window.addEventListener('input', handleInputActivity, true);
			window.addEventListener('keydown', handleInputActivity, true);
			window.addEventListener('compositionstart', handleInputActivity, true);
		}

		_initSideHud() {
			this.sideHud = document.createElement('div');
			this.sideHud.className = 'cc-side-hud';
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

		_detectActiveModel() {
			const modelEl = document.querySelector('[data-testid="model-selector-dropdown"], [class*="model-selector"], [aria-label*="Model"], button:has(span)');
			let model = 'Sonnet 5 High';
			if (modelEl) {
				const text = modelEl.innerText.trim();
				if (text && (text.includes('Sonnet') || text.includes('Opus') || text.includes('Haiku') || text.includes('Claude'))) {
					model = text.split('\n')[0].replace('ˇ', '').trim();
				}
			}
			CC._ccInternal = CC._ccInternal || {};
			CC._ccInternal.currentModel = model;
			return model;
		}

		_scrapeLiveTokens() {
			// Scrape all text on the chat screen using robust selectors
			const selector = `${CC.DOM?.USER_MESSAGES || '[data-testid="user-message"], .font-user-message'}, ${CC.DOM?.ASSISTANT_MESSAGES || '[data-testid="assistant-message"], .font-claude-message'}`;
			let messageEls = document.querySelectorAll(selector);
			
			if (messageEls.length === 0) {
				messageEls = document.querySelectorAll('[class*="ConversationItem"], [class*="chat-turn"], [class*="message-row"], [data-testid="chat-message-row"], [data-message-author-role]');
			}

			let totalChars = 0;
			messageEls.forEach((el) => {
				totalChars += el.innerText.length;
			});

			// Add current input box draft
			const inputEl = document.querySelector('textarea, [contenteditable="true"], .ProseMirror');
			if (inputEl) {
				totalChars += (inputEl.value || inputEl.innerText || '').length;
			}

			if (totalChars > 0) {
				return Math.ceil(totalChars / 3.85);
			}
			return this.currentTokens;
		}

		_renderHudContent() {
			this.modelName = this._detectActiveModel();
			const limit = CC.CONST.CONTEXT_LIMIT_TOKENS || 200000;
			const tokensUsed = this.currentTokens;
			const usedPct = Math.min(100, Math.round((tokensUsed / limit) * 100 * 10) / 10);

			const sessionPct = Math.min(100, Math.round(this.sessionUtilization * 100 * 10) / 10);
			const weeklyPct = Math.min(100, Math.round(this.weeklyUtilization * 100 * 10) / 10);

			const sessionResetStr = formatResetCountdown(this.sessionResetMs);
			const weeklyResetStr = formatResetCountdown(this.weeklyResetMs);

			// Cache TTL calculation
			let cacheHtml = '';
			if (this.cachedUntilMs && Date.now() < this.cachedUntilMs) {
				const secLeft = Math.max(0, Math.floor((this.cachedUntilMs - Date.now()) / 1000));
				cacheHtml = `<span class="cc-cache-status">⚡ 5m Cache: <b>${formatSeconds(secLeft)}</b> remaining</span>`;
			} else {
				cacheHtml = `<span class="cc-cache-status cc-cache-status--expired">⚪ Cache Window Expired</span>`;
			}

			this.sideHud.className = `cc-side-hud ${this.hudOpen ? 'cc-open' : ''}`;

			this.sideHud.innerHTML = `
				<div class="cc-hud-top">
					<div class="cc-hud-title-wrap">
						<div class="cc-hud-title">
							<span style="display:inline-block; width:18px; height:18px; background-image:url('https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif'); background-size:contain;"></span>
							<span>Claude Usage &amp; Telemetry</span>
						</div>
						<div class="cc-hud-model-tag" id="cc-model-tag">${(CC.escapeHtml ? CC.escapeHtml(this.modelName) : this.modelName)}</div>
					</div>
					<button class="cc-hud-close-btn" id="cc-hud-close" title="Close">✕</button>
				</div>

				<div class="cc-hud-body">
					<!-- 1. Current Conversation Context -->
					<div class="cc-usage-block">
						<div class="cc-metric-header">
							<span class="cc-metric-name">💬 Current Conversation</span>
							<span class="cc-metric-value" style="color: var(--cc-cyan);">${tokensUsed.toLocaleString()} / ${(limit / 1000)}k</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--cyan" style="width: ${usedPct}%;"></div>
						</div>
						<div class="cc-metric-subtext">
							<span>Context Window: <b>${usedPct}%</b></span>
							${cacheHtml}
						</div>
					</div>

					<!-- 2. 5-Hour Session Rate Limit -->
					<div class="cc-usage-block">
						<div class="cc-metric-header">
							<span class="cc-metric-name">⏱️ 5-Hour Session Limit</span>
							<span class="cc-metric-value" style="color: var(--cc-amber);">${sessionPct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill ${sessionPct > 80 ? 'cc-meter-fill--red' : 'cc-meter-fill--amber'}" style="width: ${sessionPct}%;"></div>
						</div>
						<div class="cc-metric-subtext">
							<span>Resets in: <b style="color: #fff;">${sessionResetStr}</b></span>
							<span>Rolling Window</span>
						</div>
					</div>

					<!-- 3. 7-Day Weekly Limit -->
					<div class="cc-usage-block">
						<div class="cc-metric-header">
							<span class="cc-metric-name">📅 Weekly Usage</span>
							<span class="cc-metric-value" style="color: var(--cc-purple);">${weeklyPct}%</span>
						</div>
						<div class="cc-meter-track">
							<div class="cc-meter-fill cc-meter-fill--purple" style="width: ${weeklyPct}%;"></div>
						</div>
						<div class="cc-metric-subtext">
							<span>Resets in: <b style="color: #fff;">${weeklyResetStr}</b></span>
							<span>7-Day Period</span>
						</div>
					</div>
				</div>

				<div class="cc-hud-footer">
					<button class="cc-export-btn" id="cc-export-md-btn">
						<span>📥 Export Chat (Full Thinking &amp; Artifacts)</span>
					</button>
					<button class="cc-export-json-btn" id="cc-export-json-btn">
						Export Raw JSON
					</button>
				</div>
			`;

			// Wire buttons
			this.sideHud.querySelector('#cc-hud-close').onclick = () => this.closeSideHud();
			this.sideHud.querySelector('#cc-export-md-btn').onclick = () => {
				if (CC.Exporter) CC.Exporter.exportToMarkdown();
			};
			this.sideHud.querySelector('#cc-export-json-btn').onclick = () => {
				if (CC.Exporter) CC.Exporter.exportToJson();
			};
		}

		_startRealTimeTicker() {
			if (this.tickerInterval) clearInterval(this.tickerInterval);

			// Ticks every 1 second for live real-time refresh
			this.tickerInterval = setInterval(() => {
				const liveTokens = this._scrapeLiveTokens();
				if (liveTokens !== this.currentTokens) {
					this.currentTokens = liveTokens;
				}

				// If HUD is open, update UI every second
				if (this.hudOpen) {
					this._renderHudContent();
				}
			}, 1000);
		}

		toggleSideHud() {
			this.hudOpen = !this.hudOpen;
			this._renderHudContent();
		}

		closeSideHud() {
			this.hudOpen = false;
			this.sideHud.classList.remove('cc-open');
		}

		_observeDom() {
			this.domObserver = new MutationObserver(() => {
				if (!document.contains(this.catButton)) {
					this.attachCatButton();
				}
			});
			this.domObserver.observe(document.body, { childList: true, subtree: true });
			this.attachCatButton();
		}

		attachCatButton() {
			// Find specifically the attachment/upload (+) button inside Claude's input bar
			const selector = CC.DOM?.ATTACH_BUTTON || '[data-testid="file-upload-button"], [data-testid="attach-button"], button[aria-label*="Add content" i], button[aria-label*="Attach" i], button[aria-label*="Upload" i], button[aria-label*="Add attachment" i]';
			const plusBtn = document.querySelector(selector);
			
			if (plusBtn && plusBtn.parentElement) {
				// Only insert or move if it's not already the immediate next sibling
				if (plusBtn.nextElementSibling !== this.catButton) {
					plusBtn.insertAdjacentElement('afterend', this.catButton);
				}
				return;
			}

			// Fallback: bottom-left controls container in input row
			const inputContainer = document.querySelector('[data-testid="chat-input-row"], fieldset > div, form > div');
			if (inputContainer && !inputContainer.contains(this.catButton)) {
				inputContainer.appendChild(this.catButton);
			}
		}

		tick() {
			const liveTokens = this._scrapeLiveTokens();
			if (liveTokens > 0) {
				this.currentTokens = liveTokens;
			}
			this.attachCatButton();

			// Detect if Claude is actively thinking, writing, or streaming response
			const isClaudeActive = Boolean(
				this.pendingCache ||
				document.querySelector('[data-is-streaming="true"], [data-testid="stop-button"], button[aria-label*="Stop" i], [class*="streaming"], [data-testid="thinking-block"][data-state="open"]')
			);
			if (isClaudeActive) {
				this.setCatActive(2200);
			}

			if (this.hudOpen) {
				this._renderHudContent();
			}
		}

		setUsage(normalized) {
			if (!normalized) return;
			if (normalized.five_hour) {
				const u = normalized.five_hour.utilization;
				this.sessionUtilization = u > 1 ? u / 100 : u;
				if (normalized.five_hour.resets_at) {
					this.sessionResetMs = Date.parse(normalized.five_hour.resets_at);
				}
			}
			if (normalized.seven_day) {
				const u = normalized.seven_day.utilization;
				this.weeklyUtilization = u > 1 ? u / 100 : u;
				if (normalized.seven_day.resets_at) {
					this.weeklyResetMs = Date.parse(normalized.seven_day.resets_at);
				}
			}
			if (this.hudOpen) this._renderHudContent();
		}

		setConversationMetrics(metrics) {
			if (!metrics) return;
			if (typeof metrics.totalTokens === 'number' && metrics.totalTokens > 0) {
				this.currentTokens = metrics.totalTokens;
			}
			if (metrics.cachedUntil) {
				this.cachedUntilMs = metrics.cachedUntil;
			}
			if (this.hudOpen) this._renderHudContent();
		}

		setPendingCache(pending) {
			this.pendingCache = Boolean(pending);
		}

		attachHeader() {
			this.attachCatButton();
		}

		attachUsageLine() {
			this.attachCatButton();
		}

		updateTokens(totalTokens) {
			this.currentTokens = totalTokens;
			if (this.hudOpen) this._renderHudContent();
		}

		updateUsage({ sessionUtilization, sessionResetMs, weeklyUtilization, weeklyResetMs }) {
			if (typeof sessionUtilization === 'number') this.sessionUtilization = sessionUtilization;
			if (typeof weeklyUtilization === 'number') this.weeklyUtilization = weeklyUtilization;
			if (sessionResetMs) this.sessionResetMs = sessionResetMs;
			if (weeklyResetMs) this.weeklyResetMs = weeklyResetMs;
			if (this.hudOpen) this._renderHudContent();
		}
	}

	CC.UI = CounterUI;
	CC.ui = CC.ui || {};
	CC.ui.CounterUI = CounterUI;
})();
