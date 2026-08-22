(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	/**
	 * Extracts and exports Claude.ai conversations with full thinking chains,
	 * artifacts, created files, code blocks, and telemetry metadata.
	 */
	class ConversationExporter {
		constructor() {
			this.lastExportData = null;
		}

		/**
		 * Helper to get org ID from cookies if not in memory
		 */
		_getOrgId() {
			try {
				return CC._ccInternal?.currentOrgId || document.cookie
					.split('; ')
					.find((row) => row.startsWith('lastActiveOrg='))
					?.split('=')[1] || null;
			} catch {
				return null;
			}
		}

		/**
		 * Extracts conversation messages from memory, intercepted API trunk, or DOM fallback.
		 */
		async extractConversation() {
			const activeConversationId = CC._ccInternal?.currentConversationId || this._getConversationIdFromUrl();
			let cachedTree = (CC._ccInternal?.conversationTrees && activeConversationId) 
				? CC._ccInternal.conversationTrees[activeConversationId] 
				: null;

			// If cachedTree is missing from memory (e.g. extension was reloaded without tab refresh),
			// actively fetch the raw tree from Claude's internal API on-demand via the bridge!
			if (!cachedTree && CC.bridge?.requestConversation && activeConversationId && activeConversationId.length > 5) {
				const orgId = this._getOrgId();
				if (orgId) {
					try {
						const res = await CC.bridge.requestConversation(orgId, activeConversationId);
						if (res) {
							cachedTree = res;
							CC._ccInternal.conversationTrees[activeConversationId] = res;
						}
					} catch {
						// proceed to DOM fallback
					}
				}
			}

			let messages = [];

			if (cachedTree && Array.isArray(cachedTree.chat_messages) && cachedTree.chat_messages.length > 0) {
				// Use active linear trunk (walks current_leaf_message_uuid to avoid branching duplicates)
				const trunk = CC.tokens?.buildTrunk ? CC.tokens.buildTrunk(cachedTree) : cachedTree.chat_messages;
				messages = this._parseApiMessages(trunk.length > 0 ? trunk : cachedTree.chat_messages);
			}

			// If API tree wasn't captured or produced no messages, fallback to live DOM scraping
			if (!messages || messages.length === 0) {
				messages = this._scrapeDomMessages();
			}

			const title = this._getConversationTitle(cachedTree);
			
			// Extract real token stats
			let tokenStats = CC._ccInternal?.currentTokens;
			if (!tokenStats || (!tokenStats.total && CC._ccInternal?.currentMetrics)) {
				const m = CC._ccInternal.currentMetrics;
				tokenStats = {
					total: m?.totalTokens || 0,
					input: m?.inputTokens || 0,
					output: m?.outputTokens || 0,
					cacheRead: m?.cacheReadTokens || 0,
					cacheWrite: m?.cacheWriteTokens || 0
				};
			}
			if (!tokenStats || !tokenStats.total) {
				const estTokens = CC.tokens?.countTokens 
					? messages.reduce((acc, msg) => acc + CC.tokens.countTokens(msg.text + (msg.thinking || '')), 0) 
					: 0;
				tokenStats = {
					total: estTokens,
					input: Math.floor(estTokens * 0.4),
					output: Math.floor(estTokens * 0.6),
					cacheRead: 0,
					cacheWrite: 0
				};
			}

			const model = CC._ccInternal?.currentModel || cachedTree?.model || 'Sonnet 5 High';

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

			const titleEl = document.querySelector('[data-testid="chat-title"], header h1, title, .chat-title');
			if (titleEl) {
				const text = (titleEl.textContent || titleEl.innerText || '').replace(' - Claude', '').trim();
				if (text && text !== 'Claude') return text;
			}
			return 'Claude Session';
		}

		_parseApiMessages(rawMessages) {
			if (!Array.isArray(rawMessages)) return [];

			return rawMessages.map((msg, index) => {
				const isHuman = msg.sender === 'human' || msg.sender === 'user';
				const sender = isHuman ? 'Human' : 'Claude';
				let text = typeof msg.text === 'string' ? msg.text : '';
				let thinking = typeof msg.thinking === 'string' ? msg.thinking : '';
				let artifacts = [];

				// Parse structured content array (Claude API format)
				if (Array.isArray(msg.content)) {
					for (const part of msg.content) {
						if (!part || typeof part !== 'object') continue;

						if (part.type === 'text' && typeof part.text === 'string') {
							text += (text ? '\n\n' : '') + part.text;
						} else if (part.type === 'thinking' || part.type === 'redacted_thinking') {
							const thoughtText = part.thinking || part.text || part.data || '';
							if (thoughtText) {
								thinking += (thinking ? '\n\n' : '') + thoughtText;
							}
						} else if (part.type === 'tool_use') {
							const toolName = part.name || '';
							const input = part.input || {};

							// 1. Classic Artifacts
							if (toolName === 'artifacts' || toolName.includes('artifact')) {
								artifacts.push({
									identifier: input.id || `artifact-${index + 1}`,
									title: input.title || input.name || 'Generated Artifact',
									type: input.type || input.language || 'code',
									content: input.content || (typeof input === 'string' ? input : JSON.stringify(input, null, 2))
								});
							} 
							else if (toolName === 'present_files') {
								// Presentation marker - actual file contents are captured by create_file/write_file
								continue;
							}
							// 2. Created Files (create_file, write_file, file_editor, str_replace_editor, text_editor)
							else if (
								toolName === 'create_file' || 
								toolName === 'write_file' || 
								toolName === 'file_editor' || 
								toolName === 'text_editor' || 
								toolName === 'str_replace_editor' ||
								(toolName.includes('file') && (input.path || input.file_path || input.file_text || input.content)) ||
								input.path || 
								input.file_path || 
								input.file_text
							) {
								const filePath = input.path || input.file_path || input.file_name || input.title || `file-${index + 1}`;
								const fileContent = input.file_text || input.content || input.new_str || input.text || (typeof input === 'string' ? input : JSON.stringify(input, null, 2));
								const fileType = filePath.includes('.') ? filePath.split('.').pop() : 'text';
								artifacts.push({
									identifier: `file-${index + 1}-${artifacts.length + 1}`,
									title: `📄 File: ${filePath}`,
									type: fileType,
									content: fileContent
								});
							}
							// 3. Sandboxed Code Execution (bash, repl, code execution)
							else if (toolName === 'bash' || toolName === 'repl' || toolName === 'execute' || toolName === 'code_execution') {
								const code = input.command || input.code || input.script || (typeof input === 'string' ? input : JSON.stringify(input, null, 2));
								artifacts.push({
									identifier: `exec-${index + 1}-${artifacts.length + 1}`,
									title: `💻 Command: ${toolName}`,
									type: 'bash',
									content: code
								});
							}
							// 4. General Tools
							else {
								artifacts.push({
									identifier: `tool-${toolName || 'use'}-${index + 1}`,
									title: `Tool: ${toolName || 'execution'}`,
									type: 'tool_use',
									content: typeof input === 'string' ? input : JSON.stringify(input, null, 2)
								});
							}
						} else if (part.type === 'tool_result') {
							if (part.content) {
								const contentStr = typeof part.content === 'string' ? part.content : JSON.stringify(part.content, null, 2);
								text += (text ? '\n\n' : '') + `**Tool Result:**\n\`\`\`\n${contentStr}\n\`\`\``;
							}
						} else if (part.type === 'document' || part.type === 'file') {
							artifacts.push({
								identifier: `doc-${index + 1}-${artifacts.length + 1}`,
								title: `📄 ${part.title || part.name || 'Document'}`,
								type: 'document',
								content: part.text || part.content || ''
							});
						}
					}
				}

				// Parse attachments (e.g. extracted text from uploads)
				if (Array.isArray(msg.attachments)) {
					for (const att of msg.attachments) {
						if (att?.extracted_content) {
							text += (text ? '\n\n' : '') + `**Attachment (${att.file_name || 'file'}):**\n${att.extracted_content}`;
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

				// Extract inline <antArtifact> tags if present in text
				if (text.includes('<antArtifact')) {
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
					text: text.trim(),
					thinking: thinking.trim(),
					artifacts,
					createdAt: msg.created_at || new Date().toISOString(),
					truncated: msg.stop_reason === 'max_tokens' || Boolean(msg.truncated)
				};
			});
		}

		_scrapeDomMessages() {
			const userSelector = CC.DOM?.USER_MESSAGES || '[data-testid="user-message"], .font-user-message, [data-message-author-role="user"]';
			const assistantSelector = CC.DOM?.ASSISTANT_MESSAGES || '[data-testid="assistant-message"], .font-claude-message, [data-message-author-role="assistant"], div[data-is-streaming]';

			// First, attempt to match turn containers for 100% paired ordering
			const turnContainers = document.querySelectorAll('[class*="ConversationItem"], [class*="chat-turn"], [class*="message-row"], [data-testid="chat-message-row"]');
			const messages = [];

			if (turnContainers.length > 0) {
				turnContainers.forEach((turn, idx) => {
					const isUser = turn.querySelector(userSelector) || turn.getAttribute('data-message-author-role') === 'user' || turn.classList.contains('font-user-message');
					const sender = isUser ? 'Human' : 'Claude';

					let thinking = '';
					const thinkingEl = turn.querySelector('[data-testid="thinking-block"], details, [class*="thinking"], [class*="Thinking"]');
					if (thinkingEl) {
						thinking = thinkingEl.innerText.trim();
					}

					const artifacts = [];
					const artifactEls = turn.querySelectorAll('[data-testid="file-preview"], [data-testid="code-block"], [class*="FilePreview"], [class*="FileCard"], [data-testid="artifact-button"], [class*="artifact"], pre code');
					artifactEls.forEach((art, aIdx) => {
						const title = art.getAttribute('data-title') || art.getAttribute('data-artifact-title') || art.querySelector('[class*="title"], [class*="name"]')?.innerText || `Artifact ${aIdx + 1}`;
						artifacts.push({
							identifier: `artifact-${idx + 1}-${aIdx + 1}`,
							title,
							type: art.getAttribute('data-type') || 'code',
							content: art.innerText.trim()
						});
					});

					let text = turn.innerText.trim();
					if (thinking && text.includes(thinking)) {
						text = text.replace(thinking, '').trim();
					}

					if (text || thinking || artifacts.length > 0) {
						messages.push({
							index: idx + 1,
							sender,
							text,
							thinking,
							artifacts,
							createdAt: new Date().toISOString()
						});
					}
				});

				if (messages.length > 0) return messages;
			}

			// Fallback: Query all user and assistant elements directly
			const allElements = document.querySelectorAll(`${userSelector}, ${assistantSelector}`);
			allElements.forEach((el, idx) => {
				const isHuman = el.matches(userSelector) || el.getAttribute('data-message-author-role') === 'user' || el.classList.contains('font-user-message');
				
				let thinking = '';
				const thinkingEl = el.querySelector('[data-testid="thinking-block"], details, [class*="thinking"], [class*="Thinking"]');
				if (thinkingEl) {
					thinking = thinkingEl.innerText.trim();
				}

				const artifacts = [];
				const artifactEls = el.querySelectorAll('[data-testid="file-preview"], [data-testid="code-block"], [class*="FilePreview"], [data-testid="artifact-button"], pre code, [class*="artifact"]');
				artifactEls.forEach((art, aIdx) => {
					artifacts.push({
						identifier: `artifact-${idx + 1}-${aIdx + 1}`,
						title: art.getAttribute('data-title') || `Artifact ${aIdx + 1}`,
						type: 'code',
						content: art.innerText.trim()
					});
				});

				let text = el.innerText.trim();
				if (thinking && text.includes(thinking)) {
					text = text.replace(thinking, '').trim();
				}

				if (text || thinking || artifacts.length > 0) {
					messages.push({
						index: idx + 1,
						sender: isHuman ? 'Human' : 'Claude',
						text,
						thinking,
						artifacts,
						createdAt: new Date().toISOString()
					});
				}
			});

			return messages;
		}

		/**
		 * Exports the extracted session to formatted Markdown (.md)
		 */
		async exportToMarkdown() {
			const data = await this.extractConversation();
			this.lastExportData = data;

			let md = `# ${data.title}\n\n`;
			md += `> **Model**: ${data.model}  \n`;
			md += `> **Exported At**: ${new Date(data.exportedAt).toLocaleString()}  \n`;
			md += `> **Total Tokens**: ${Number(data.tokenStats.total || 0).toLocaleString()} tokens  \n`;
			md += `> **Input**: ${Number(data.tokenStats.input || 0).toLocaleString()} | **Output**: ${Number(data.tokenStats.output || 0).toLocaleString()} | **Cache Read**: ${Number(data.tokenStats.cacheRead || 0).toLocaleString()}\n\n`;
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
						md += `#### 📦 ${art.title}\n`;
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
		async exportToJson() {
			const data = await this.extractConversation();
			this.lastExportData = data;
			const jsonStr = JSON.stringify(data, null, 2);
			this._triggerDownload(`${this._sanitizeFilename(data.title)}.json`, jsonStr, 'application/json');
			return data;
		}

		_sanitizeFilename(title) {
			const clean = (title || '')
				.replace(/[\\/:*?"<>|]/g, '')
				.trim()
				.replace(/\s+/g, '_')
				.substring(0, 60);
			return clean || 'claude-session-' + Date.now();
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
