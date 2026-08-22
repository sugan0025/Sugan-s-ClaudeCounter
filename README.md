# 🐱 Sugan's ClaudeCounter & Telemetry HUD

> **Pure Frosted Liquid Glass Telemetry HUD, Real-Time Token Breakdown, 5-Hour & 7-Day Limit Tracking, Dynamic Typing Cat, and Resilient Full Session Exporter (Thinking Process, Created Files & Artifacts) for Claude.ai.**

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:E28743,100:1a1b27&height=180&section=header&text=Sugan's%20ClaudeCounter%20HUD&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=AI%20Telemetry%20%7C%20Frosted%20Liquid%20Glass%20%7C%20Thinking%20&%20Artifact%20Exporter&descAlignY=55&descSize=14&descColor=cccccc"/>

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
  <img src="https://img.shields.io/badge/Supports-Sonnet_5_High-38BDF8?style=for-the-badge&logoColor=white" alt="Sonnet 5 High" />
</a>
&nbsp;
<a href="#">
  <img src="https://img.shields.io/badge/Design-Frosted_Liquid_Glass-10B981?style=for-the-badge&logoColor=white" alt="Liquid Glass" />
</a>
&nbsp;
<a href="#">
  <img src="https://img.shields.io/badge/Export-Thinking_+_Files-EF4444?style=for-the-badge&logoColor=white" alt="Export" />
</a>

</div>

---

## 🌟 Key Features

### 1. 🐱 Dynamic Interactive Typing Cat in Chat Input
- **Docked Right Next to `+`**: Perfectly aligned in Claude's prompt box without shifting or drifting when attaching files or typing long drafts.
- **Dynamic State Machine**:
  - 😴 **Calm Static Pose (Idle)**: Sits quietly at its desk when there is no activity.
  - ⌨️ **Fast Typing Animation (Active)**: Starts fast typing whenever you type in the input box or whenever Claude is writing / thinking!
  - ⏳ Smoothly returns to idle 2.5s after activity ends.

### 2. 🧊 Pure Frosted Liquid Glass Telemetry HUD
- **Single Clean Usage Card**: Deep acrylic background blur (`36px saturate(210%)`), specular rim lighting, and luminous glowing neon meters.
- **Dynamic Model Auto-Detection**: Automatically detects active models like `Sonnet 5 High`, `Claude 3.7 Sonnet`, `Opus`, or `Haiku`.
- **💬 Current Conversation**: Real-time token consumption (`28.4k / 200k`) + 5-minute sliding cache TTL countdown with live warning indicator.
- **⏱️ 5-Hour Session Limit**: Rolling window rate limit percentage (`90% - Resets in 4h 16m`).
- **📅 7-Day Weekly Usage**: 7-Day rolling period utilization (`3% - Resets in 5d 4h`).

### 3. 📥 Resilient Session Exporter (Thinking Process, Created Files & Artifacts)
- Exports complete chat history even if the model stopped mid-generation or ran out of tokens!
- **💭 Extended Thinking**: Full chain-of-thought reasoning traces preserved in formatted blockquotes.
- **📄 Created Files & Tools**: Extracts sandboxed file creation (`create_file`, `write_file`, `file_editor`, `text_editor`), code executions (`bash`, `repl`), and classic UI artifacts with original file paths and full contents.
- **Accurate Telemetry Header**: Injects active model, total token counts, input/output/cache stats, and timestamp.
- Exports to clean **Markdown (.md)** or structured **JSON (.json)** in 1 click.

---

## 🚀 Installation

### 1. Chrome / Edge / Brave (Unpacked Extension)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/sugan0025/Sugan-s-ClaudeCounter.git
   ```
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `sugans-claudecounter` directory.
5. Open [claude.ai](https://claude.ai) — look for the 🐱 **Cat** button right next to `+` in your input bar!

### 2. Tampermonkey / Violentmonkey (Userscript)
1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open [`userscript/claude-counter.user.js`](./userscript/claude-counter.user.js) and click **Install**.

---

## 💻 Live Web Simulator

Open `index.html` in any browser to test and interact with the live telemetry HUD, pure frosted liquid glass design, dynamic typing cat, and chat export without opening claude.ai.

---

## 🛡️ Privacy & Security

- **100% Client-Side**: All token scraping, calculations, and exports happen locally inside your browser.
- **XSS Sanitized**: Safe DOM rendering and Unicode-safe filename sanitization.
- **Zero Third-Party Tracking**: No external telemetry servers or data collectors.

---

## 📄 License

MIT © [sugan0025](https://github.com/sugan0025)
