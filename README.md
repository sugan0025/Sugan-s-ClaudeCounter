# 🐱 Sugan's ClaudeCounter & Telemetry HUD

> **Ultra-Modern Glassmorphic AI Telemetry HUD, Real-Time Token Breakdown, 5-Hour Rate Limit Forecasting, and Resilient Chat Exporter (Thinking Process & Artifacts) for Claude.ai.**

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:E28743,100:1a1b27&height=180&section=header&text=Sugan's%20ClaudeCounter%20HUD&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=AI%20Telemetry%20%7C%20Rate%20Limits%20%7C%20Thinking%20&%20Artifact%20Exporter&descAlignY=55&descSize=14&descColor=cccccc"/>

<!-- Badges -->
<a href="#">
  <img src="https://img.shields.io/badge/Manifest-V3_Extension-E28743?style=for-the-badge&logoColor=white" alt="Manifest V3" />
</a>
&nbsp;
<a href="#">
  <img src="https://img.shields.io/badge/Userscript-Tampermonkey-8B5CF6?style=for-the-badge&logoColor=white" alt="Userscript" />
</a>
&nbsp;
<a href="#">
  <img src="https://img.shields.io/badge/Supports-Claude_3.7_Sonnet-38BDF8?style=for-the-badge&logoColor=white" alt="Claude 3.7" />
</a>
&nbsp;
<a href="#">
  <img src="https://img.shields.io/badge/Export-Thinking_+_Artifacts-10B981?style=for-the-badge&logoColor=white" alt="Export" />
</a>

</div>

---

## 🌟 Key Features

### 1. 🐱 Working Cat Telemetry Button in Chat Input
- Seamlessly docked inside the Claude.ai message input bar without shifting or interfering with chat layout.
- Click to smoothly slide in the 3-tabbed frosted glass HUD.

### 2. 📊 3-Card Glassmorphism Telemetry HUD
- 🟧 **/usage (Account Level)**:
  - Plan type (`Pro` / `Max` / `Team`)
  - 5-Hour rolling window rate limit with unrounded SSE precision (`1,247 / 2,000`)
  - Real-time countdown timer (`Resets in 3h 42m`)
  - 5-Minute sliding cache TTL timer with warning pulse (<60s)
  - Estimated dollar cost ($) & prompt caching savings
- 🟪 **/stats (Historical Trends)**:
  - 7-Day Activity Heatmap matrix (multi-level density blocks)
  - Total tokens burned, session count, streak counter, and favorite model
- 🟦 **/context (Current Session)**:
  - Context partition breakdown (System prompt %, Project Memory %, Messages %, Free Space %)
  - Live token count gauge (`51k / 200k tokens - 26%`)

### 3. 📥 Resilient Session Exporter (Thinking + Artifacts)
- Exports complete chat history even if the model stopped mid-generation or ran out of tokens!
- **Extended Thinking**: Preserves full reasoning traces in clean blockquotes.
- **Artifacts**: Extracts all code files, SVGs, HTML, and Markdown artifacts with syntax tags.
- Exports to clean **Markdown (.md)** or structured **JSON (.json)** with 1 click.

---

## 🚀 Installation

### 1. Chrome / Edge / Brave (Developer Mode)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/sugan0025/Sugan-s-ClaudeCounter.git
   ```
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this directory (`sugans-claudecounter`).
5. Open [claude.ai](https://claude.ai) — look for the 🐱 **Telemetry** button in your input bar!

### 2. Tampermonkey / Violentmonkey (Userscript)
1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open [`userscript/claude-counter.user.js`](./userscript/claude-counter.user.js) and click **Install**.

---

## 💻 Live Web Simulator

Open `index.html` in any browser to test and interact with the live telemetry HUD, adjust token sliders, simulate rate limits, and test chat exports without opening claude.ai.

---

## 🛡️ Privacy & Security

- **100% Local**: All token counting and telemetry calculations happen client-side inside your browser.
- **Zero Third-Party Tracking**: No external servers, telemetry collectors, or analytics endpoints.

---

## 📄 License

MIT © [sugan0025](https://github.com/sugan0025)
