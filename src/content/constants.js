(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.DOM = Object.freeze({
		CHAT_MENU_TRIGGER: '[data-testid="chat-menu-trigger"]',
		MODEL_SELECTOR_DROPDOWN: '[data-testid="model-selector-dropdown"], [class*="model-selector"], [aria-label*="Model"]',
		CHAT_PROJECT_WRAPPER: '.chat-project-wrapper',
		CHAT_INPUT_CONTAINER: '[data-testid="chat-input-row"], [class*="chat-input"], form fieldset',
		BRIDGE_SCRIPT_ID: 'cc-bridge-script',
		USER_MESSAGES: '[data-testid="user-message"], .font-user-message, [data-message-author-role="user"], div[class*="font-user"]',
		ASSISTANT_MESSAGES: '[data-testid="assistant-message"], .font-claude-message, [data-message-author-role="assistant"], div[class*="font-claude"], div.font-claude-message, div:has(> .font-claude-message), div[data-is-streaming], [class*="standard-message"]'
	});

	CC.CONST = Object.freeze({
		CACHE_WINDOW_MS: 5 * 60 * 1000,
		CONTEXT_LIMIT_TOKENS: 200000,
		SESSION_LIMIT_WINDOW_MS: 5 * 60 * 60 * 1000
	});

	// Anthropic API Token Pricing per Million Tokens ($ / MTok)
	CC.PRICING = Object.freeze({
		'claude-3-7-sonnet': {
			name: 'Claude 3.7 Sonnet',
			input: 3.00,
			output: 15.00,
			cacheWrite: 3.75,
			cacheRead: 0.30
		},
		'claude-3-5-sonnet': {
			name: 'Claude 3.5 Sonnet',
			input: 3.00,
			output: 15.00,
			cacheWrite: 3.75,
			cacheRead: 0.30
		},
		'claude-3-5-haiku': {
			name: 'Claude 3.5 Haiku',
			input: 0.80,
			output: 4.00,
			cacheWrite: 1.00,
			cacheRead: 0.08
		},
		'claude-3-opus': {
			name: 'Claude 3 Opus',
			input: 15.00,
			output: 75.00,
			cacheWrite: 18.75,
			cacheRead: 1.50
		}
	});

	CC.COLORS = Object.freeze({
		USAGE_ORANGE: '#E28743',
		USAGE_ORANGE_GLOW: 'rgba(226, 135, 67, 0.35)',
		STATS_PURPLE: '#8B5CF6',
		STATS_PURPLE_GLOW: 'rgba(139, 92, 246, 0.35)',
		CONTEXT_BLUE: '#38BDF8',
		CONTEXT_BLUE_GLOW: 'rgba(56, 189, 248, 0.35)',
		SUCCESS_GREEN: '#10B981',
		RED_WARNING: '#EF4444',
		DARK_BG: '#0d1117',
		DARK_CARD_BG: 'rgba(13, 17, 23, 0.92)',
		DARK_BORDER: 'rgba(255, 255, 255, 0.12)',
		PROGRESS_FILL_DARK: '#38BDF8',
		PROGRESS_FILL_LIGHT: '#0284C7',
		PROGRESS_OUTLINE_DARK: '#30363d',
		PROGRESS_OUTLINE_LIGHT: '#e2e8f0',
		PROGRESS_MARKER_DARK: '#ffffff',
		PROGRESS_MARKER_LIGHT: '#0f172a',
		BOLD_LIGHT: '#0f172a',
		BOLD_DARK: '#f8fafc'
	});
})();
