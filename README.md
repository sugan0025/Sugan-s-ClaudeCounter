<!-- ═══════════════════════════════════════════════════════════════════════════════════ -->
<!-- ░░░ SUGAN'S CLAUDECOUNTER & TELEMETRY HUD — AI TELEMETRY & RECOVERY ENGINE ░░░░░░░░ -->
<!-- ═══════════════════════════════════════════════════════════════════════════════════ -->

<!-- ╔═══════════════════════════════╗ -->
<!-- ║   ANIMATED GRADIENT HEADER    ║ -->
<!-- ╚═══════════════════════════════╝ -->
<div align="center">

<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/header-banner.svg" width="100%" alt="Sugan's ClaudeCounter Animated Header" />

<br><br>

<!-- Animated Typing SVG (Single-line, zero overflow) -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=19&duration=3000&pause=1000&color=E28743&center=true&vCenter=true&repeat=true&width=750&height=45&lines=Pure+Frosted+Liquid+Glass+HUD+%E2%80%A2+36px+Acrylic+Backdrop+Blur;Dynamic+Typing+Cat+Mascot+%E2%80%A2+Prompt+Box+Dock+%E2%80%A2+Zero+Jitter;Real-Time+Token+Scraper+%E2%80%A2+5-Min+Sliding+Cache+TTL+Countdown;Extended+Thinking+%E2%80%A2+Created+Files+Sandbox+%E2%80%A2+Markdown+%26+JSON" alt="Typing SVG" />
</a>

<br><br>

<!-- Badges Row 1: Extension Architecture & Engine -->
<a href="https://developer.chrome.com/docs/extensions/mv3/intro/">
  <img src="https://img.shields.io/badge/Manifest_V3-Chrome_Extension-E28743?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3 Extension" />
</a>
&nbsp;
<a href="https://www.tampermonkey.net/">
  <img src="https://img.shields.io/badge/Userscript-Tampermonkey_Ready-8B5CF6?style=for-the-badge&logo=tampermonkey&logoColor=white" alt="Tampermonkey Userscript" />
</a>
&nbsp;
<a href="https://www.anthropic.com/claude">
  <img src="https://img.shields.io/badge/Supports-Sonnet_5_High_%26_Claude_3.7-38BDF8?style=for-the-badge&logo=anthropic&logoColor=white" alt="Supports Claude Models" />
</a>

<br><br>

<!-- Badges Row 2: Design, Resilience & Privacy -->
<img src="https://img.shields.io/badge/Design-Frosted_Liquid_Glass-10B981?style=for-the-badge&logo=css3&logoColor=white" alt="Frosted Liquid Glass Design" />
&nbsp;
<img src="https://img.shields.io/badge/Export-Thinking_%2B_Files_%2B_Artifacts-EF4444?style=for-the-badge&logo=markdown&logoColor=white" alt="Thinking & Artifacts Export" />
&nbsp;
<img src="https://img.shields.io/badge/Privacy-100%25_Client--Side_Local-16A34A?style=for-the-badge&logo=shield&logoColor=white" alt="100% Client-Side Privacy" />
&nbsp;
<a href="./LICENSE">
  <img src="https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="MIT License" />
</a>

<br><br>

<p align="center">
  <b>A high-performance browser extension and userscript providing pure frosted liquid glass telemetry, real-time token tracking with 5-minute sliding cache TTL countdowns, a dynamic typing cat companion, and a resilient full-session exporter preserving chain-of-thought reasoning, tool executions, and sandboxed code files for Claude.ai.</b>
</p>

[🐱 Dynamic Mascot](#-dynamic-interactive-typing-cat-in-chat-input) • [🧊 Liquid Glass HUD](#-pure-frosted-liquid-glass-telemetry-hud) • [⏱️ Telemetry & Limits](#-real-time-telemetry-token-lifecycle--session-recovery-pipeline) • [📥 Session Exporter](#-resilient-session-exporter-thinking-process-created-files--artifacts) • [🏗️ Architecture](#️-system-architecture) • [🚀 Installation](#-installation) • [🗂️ Project Structure](#️-project-structure--directory-map)

</div>

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║       EXECUTIVE SUMMARY       ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>📌 Executive Overview &amp; Problem Statement</h2>

Power users, software architects, and researchers leveraging **Claude.ai** frequently engage in long multi-turn programming sessions, complex refactoring tasks, and deep analytical investigations. 

Standard web interfaces lack proactive observability into **context window token limits**, provide no visibility into **Anthropic's 5-minute prompt cache expiration window**, and leave users vulnerable to sudden rate limits (`5-Hour` and `7-Day` windows) with no instant way to archive thinking traces or download generated code sandboxes before the window expires:

```yaml
Extension Status    : Production Ready (Manifest V3 Extension & Tampermonkey Userscript)
Model Compatibility : Claude.ai (Sonnet 5 High • Claude 3.7 Sonnet • Opus 3 • Haiku)
Visual Design System: Pure Frosted Liquid Glass (36px backdrop-blur saturate(210%))
Core Telemetry      : Live O200k Token Breakdown • 5-Min Cache TTL • 5h/7d Rolling Rate Limits
Interactive Mascot  : Zero-Drift Dynamic Typing Cat (Docked inside Claude's Prompt Bar)
Recovery Engine     : Extended Thinking Traces • Tool Calls • Sandboxed File Reconstitution
Security Model      : 100% Client-Side Local • Zero Remote Servers • No Analytics Tracking
```

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      FROSTED GLASS CARDS      ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>✨ Engineering Highlights &amp; Core Pillars</h2>

<div align="center">

<!-- Row 1: Liquid Glass HUD + Dynamic Typing Cat -->
<a href="#-pure-frosted-liquid-glass-telemetry-hud">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/card-hud.svg" width="48%" alt="Frosted Liquid Glass HUD" />
</a>
&nbsp;&nbsp;
<a href="#-dynamic-interactive-typing-cat-in-chat-input">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/card-cat.svg" width="48%" alt="Dynamic Interactive Typing Cat" />
</a>

<br><br>

<!-- Row 2: Resilient Exporter + Web Simulator -->
<a href="#-resilient-session-exporter-thinking-process-created-files--artifacts">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/card-exporter.svg" width="48%" alt="Thinking & Artifact Exporter" />
</a>
&nbsp;&nbsp;
<a href="#-live-web-simulator">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/card-simulator.svg" width="48%" alt="Zero-Dependency Web Simulator" />
</a>

</div>

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      KEY FEATURES SECTION     ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🌟 Deep-Dive Feature Architecture</h2>

### 1. 🐱 Dynamic Interactive Typing Cat in Chat Input
* **Docked Beside Prompt Bar `+` Button**: Directly anchored via `MutationObserver` without drifting or misaligning when users attach images, upload code files, or type multi-paragraph prompts.
* **Deterministic 3-State Machine**:
  * 😴 **Calm Pose (`IDLE`)**: Sits serenely at its desk when the user is idle and Claude is stationary.
  * ⌨️ **Fast Typing Animation (`TYPING`)**: Initiates rapid typing animation on keystrokes, composition events, or whenever Claude streams response tokens.
  * 🧠 **Thinking Synchronization (`THINKING`)**: Stays animated during Claude's extended thinking phases, automatically easing back to idle with a 2.5-second decay curve once generation ceases.
* **Zero UI Interruption**: Completely decoupled from Claude's keyboard navigation and focus management.

### 2. 🧊 Pure Frosted Liquid Glass Telemetry HUD
* **Multi-Layer Optical Compositing**:
  * Deep acrylic backdrop filter (`36px saturate(210%) brightness(1.05)`) with custom specular border rim highlights.
  * Neon luminous progress meters for immediate cognitive readouts without visual clutter.
* **Dynamic Model Auto-Detection**:
  * Automatically recognizes active models (`Sonnet 5 High`, `Claude 3.7 Sonnet`, `Opus 3`, `Haiku`) from DOM markers and internal payload contexts.
* **💬 Current Conversation Tokens**:
  * Displays precise live token consumption (`e.g. 28.4k / 200k`) calculated against Claude's tokenizer heuristics.
* **⚡ 5-Minute Sliding Cache TTL Countdown**:
  * Live countdown tracking Anthropic's prompt cache TTL. If your countdown drops below 1 minute, the HUD shifts to a glowing amber warning state, notifying you to send a message before cache eviction occurs.
* **⏱️ 5-Hour Session Window & 📅 7-Day Usage Tracking**:
  * Scrapes and visualizes rolling rate limits with live reset timestamps (`90% - Resets in 4h 16m`) and 7-day rolling metrics (`3% - Resets in 5d 4h`).

### 3. 📥 Resilient Session Exporter (Thinking, Files & Artifacts)
* **Halting Recovery Guarantee**:
  * Traditional export tools fail if generation stops abruptly or hits a token limit. Sugan's ClaudeCounter traverses the live DOM tree, extracting every complete and partial message with full integrity.
* **💭 Extended Chain-of-Thought Extraction**:
  * Extracts Claude's hidden and visible thinking blocks, preserving step-by-step reasoning traces in formatted Markdown callouts.
* **📄 Code Sandboxes & Tool Reconstitution**:
  * Detects and parses tool invocations (`create_file`, `write_file`, `file_editor`, `text_editor`), shell commands (`bash`), and UI artifacts—extracting full file names, paths, and contents.
* **Dual Format Export**:
  * **Markdown (.md)**: Render-ready document with syntax-highlighted code blocks and metadata headers.
  * **JSON (.json)**: Structured array of conversation nodes containing token telemetry, timestamps, and tool metadata for downstream analysis.

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║    PIPELINE & WORKFLOW        ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🔄 Real-Time Telemetry, Token Lifecycle &amp; Session Recovery Pipeline</h2>

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/pipeline-flow-banner.svg" width="98%" alt="End-to-End ClaudeCounter Telemetry Pipeline" />
</div>

<br>

| Phase | Pipeline Step | Technical &amp; Security Mechanism |
|---|---|---|
| **1. Prompt Box Anchor** | Client DOM Hook | `MutationObserver` detects prompt box container and attaches cat button adjacent to `+` with zero layout drift. |
| **2. State Machine** | Dynamic Mascot Engine | Monitors `keyup`, `compositionstart`, and streaming response nodes; routes between `IDLE`, `TYPING`, and `THINKING`. |
| **3. Token & Cache Scraper** | Telemetry Ingestion | Parses active conversation messages using byte-pair encoding heuristics; starts 5-minute sliding countdown for cache TTL. |
| **4. Frosted Glass Render** | HUD Interface | Computes percentage against 200k context window, 5-hour rolling limit, and 7-day window; renders via 36px frosted acrylic CSS. |
| **5. Session Extraction** | Resilient Recovery Engine | Deep-scrapes thought blocks, file creation tools (`create_file`, `write_file`), and UI artifacts into memory. |
| **6. Sanitized Export** | Client File Generation | Injects metadata header (model, tokens, timestamp); generates downloadable `.md` or `.json` with Unicode-safe filename sanitization. |

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      SYSTEM ARCHITECTURE      ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🏗️ System Architecture</h2>

<p align="center">
  <b>A modular, zero-dependency client architecture engineered for lightweight execution, real-time DOM synchronization, and zero third-party telemetry leakage.</b>
</p>

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/architecture-diagram.svg" width="100%" alt="Sugan's ClaudeCounter Architecture Diagram" />
</div>

<br>

### Architectural Tier Breakdown

1. **Client & DOM Injector (`src/content/main.js` & `bridge.js`)**:
   - Observes Claude's single-page app navigation cycles.
   - Binds directly into the input bar toolbar without interfering with Claude's native keyboard shortcuts (`Enter`, `Shift+Enter`).
   - Manages state machine transitions with microtask scheduling.

2. **Liquid Glass HUD Engine (`src/content/ui.js` & `src/styles.css`)**:
   - Non-blocking absolute HUD overlay styled with GPU-accelerated CSS properties (`will-change: transform`).
   - Adapts to system and Claude light/dark modes with customized glass tint variables.

3. **Telemetry & Token Scraper (`src/content/tokens.js` & `src/vendor/o200k_base.js`)**:
   - High-throughput tokenizer counting prompt and response tokens locally in real time.
   - Calculates prompt cache retention windows and sliding-window replenishment cycles.

4. **Resilient Session Exporter (`src/content/exporter.js`)**:
   - Traverses React virtual DOM elements and rendered code containers.
   - Extracts complete files generated inside Claude's execution sandbox, stitching fragmented code blocks into single files.

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║       INSTALLATION GUIDE      ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🚀 Installation &amp; Setup</h2>

### Method 1: Chrome / Edge / Brave (Unpacked Extension — Recommended)

1. **Clone this repository**:
   ```bash
   git clone https://github.com/sugan0025/Sugan-s-ClaudeCounter.git
   ```
2. Navigate to your browser's extension management page:
   - **Google Chrome**: `chrome://extensions/`
   - **Microsoft Edge**: `edge://extensions/`
   - **Brave Browser**: `brave://extensions/`
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the cloned `Sugan-s-ClaudeCounter` directory.
5. Open [claude.ai](https://claude.ai) — observe the 🐱 **Cat companion** seamlessly docked beside the `+` button in your prompt bar!

### Method 2: Tampermonkey / Violentmonkey (Cross-Browser Userscript)

1. Ensure [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) is installed in your browser.
2. Open [`userscript/claude-counter.user.js`](./userscript/claude-counter.user.js) in your browser or click **New Script** and paste its content.
3. Click **Install**.
4. Refresh [claude.ai](https://claude.ai) to activate the HUD.

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      LIVE WEB SIMULATOR       ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>💻 Standalone Web Simulator</h2>

Experience the complete HUD interface, test real-time token calculation, switch simulated models, trigger cat typing animations, and preview exports **locally offline without needing an active Claude.ai account**:

1. Open [`index.html`](./index.html) directly in any modern browser:
   ```bash
   # Windows PowerShell
   Start-Process index.html
   ```
2. **Interactive Controls Available**:
   - **Model Selector**: Switch between `Sonnet 5 High`, `Claude 3.7 Sonnet`, `Opus 3`, and `Haiku`.
   - **Token Sliders**: Adjust conversation token count to test cache warnings and limit alerts.
   - **Activity Simulator**: Click the typing test buttons to preview cat state transitions (`Idle` ↔ `Typing` ↔ `Decay`).
   - **Export Tester**: Click **Export Session** to verify Markdown and JSON parsing logic.

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      PROJECT STRUCTURE        ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🗂️ Project Structure &amp; Directory Map</h2>

```
Sugan-s-ClaudeCounter/
│
├── assets/                                 # Vector SVG banners, diagrams & visual assets
│   ├── architecture-diagram.svg            # 4-Tier system architecture vector diagram
│   ├── card-cat.svg                        # Highlight card: Typing Cat state machine
│   ├── card-exporter.svg                   # Highlight card: Thinking & Artifact exporter
│   ├── card-hud.svg                        # Highlight card: Frosted liquid glass HUD
│   ├── card-simulator.svg                  # Highlight card: Zero-dependency web simulator
│   ├── header-banner.svg                   # Dynamic brand header banner
│   ├── pipeline-flow-banner.svg            # End-to-end token & recovery pipeline diagram
│   ├── rainbow-divider.svg                 # Animated glowing neon separator
│   └── screenshot.png                      # High-resolution production interface screenshot
│
├── icons/                                  # Multi-resolution extension icon package
│   ├── icon.png                            # Master vector icon
│   ├── icon16.png                          # Favicon density
│   ├── icon32.png                          # Browser action icon
│   ├── icon48.png                          # Extensions management page
│   ├── icon96.png                          # High-DPI displays
│   ├── icon128.png                         # Chrome Web Store preview
│   └── icon256.png                         # Retina display icon
│
├── src/                                    # Extension Core Source Code
│   ├── content/                            # Content scripts injected into claude.ai
│   │   ├── bridge-client.js                # Inter-context communication bridge
│   │   ├── constants.js                    # Model thresholds, rate limit constants & styles
│   │   ├── exporter.js                     # Resilient thinking, file & artifact exporter
│   │   ├── main.js                         # Root content script & MutationObserver loop
│   │   ├── tokens.js                       # Real-time token heuristics & cache TTL calculator
│   │   └── ui.js                           # Liquid glass HUD DOM renderer & event handlers
│   │
│   ├── injected/                           # Injected scripts running in page context
│   │   └── bridge.js                       # Native fetch & payload interceptor
│   │
│   ├── vendor/                             # Bundled zero-dependency vendor modules
│   │   └── o200k_base.js                   # O200k byte-pair encoding token parser
│   │
│   └── styles.css                          # Frosted liquid glass stylesheet (36px blur)
│
├── userscript/                             # Tampermonkey / Violentmonkey distribution
│   └── claude-counter.user.js              # Standalone bundled userscript
│
├── index.html                              # Standalone offline web simulator
├── manifest.json                           # Chrome Extension Manifest V3 configuration
├── LICENSE                                 # MIT Open Source License
├── THIRD_PARTY_NOTICES.md                  # Third-party notices and attributions
└── README.md                               # Production documentation & engineering guide
```

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║      PRIVACY & SECURITY       ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>🛡️ Privacy, Security &amp; Zero-Trust Client Engineering</h2>

* **Zero External Telemetry**: Sugan's ClaudeCounter operates strictly within your local browser sandbox. It makes **zero network requests** to external logging servers, analytics providers, or remote endpoints.
* **Non-Invasive DOM Anchoring**: All DOM injections utilize isolated shadow structures or dedicated class scopes, preventing styling bleeding into Claude's native design system.
* **Strict Content Security Policy (CSP)**: Compatible with Claude.ai's strict security policies; does not use `eval()` or unvetted inline script execution.
* **Sanitized File Exporting**: File names and paths extracted from chat sessions are rigorously stripped of dangerous path traversal patterns (`../`, `~`) before generating browser download blobs.

<!-- Animated Glowing Divider -->
<img src="https://cdn.jsdelivr.net/gh/sugan0025/Sugan-s-ClaudeCounter@main/assets/rainbow-divider.svg" width="100%">

<!-- ╔═══════════════════════════════╗ -->
<!-- ║       AUTHOR & CREDITS        ║ -->
<!-- ╚═══════════════════════════════╝ -->

<h2>👨‍💻 Author &amp; Credits</h2>

Engineered with passion by **Sugan S** ([@sugan0025](https://github.com/sugan0025)).

Special thanks to the Anthropic community, creators of the BPE tokenization heuristics, and the developers behind open web user-customization tools.

<br>

<div align="center">

[![GitHub Profile](https://img.shields.io/badge/GitHub-sugan0025-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sugan0025)
&nbsp;
[![LinkedIn Profile](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sugan0025)

<br><br>

<b>MIT License © 2026 Sugan S. All rights reserved.</b>

</div>
