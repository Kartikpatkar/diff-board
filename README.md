# 🔀 DiffBoard – Code Comparison Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.1.3-blue.svg)](#)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg?logo=google-chrome)](#)

> **Tagline**: *Compare code, text, and JSON like a developer — fast, visual, and distraction-free.*

---

## ✨ Overview

**DiffBoard** is a modern, developer-friendly **Chrome Extension** that opens from the extension toolbar and helps you **compare code, text, JSON, logs, and config files** with a clean UI and powerful diff visualization.

Built for developers who frequently compare:

* API responses
* Code changes
* Config files
* JSON payloads
* Logs and text outputs

DiffBoard focuses on **clarity, speed, and usability**, without overwhelming you with unnecessary complexity.

---

## 🚀 Key Features

### 🔍 Side-by-Side Code Comparison

* Paste or drop files into the **Original** and **Modified** editors
* Visual, GitHub-style diff output
* Clear highlights for:

  * ➕ Added lines
  * ➖ Removed lines
  * ✏️ Modified lines

### 📊 Diff Summary Panel

* Instant statistics:

  * Lines added
  * Lines removed
  * Lines modified
* Always visible above the diff results

### 📋 Copy Utilities

* Copy **left input**
* Copy **right input**
* Copy **full diff**
* Copy **only added** or **only removed** lines
* Download the rendered comparison as `diff.txt` or `diff.html`
* Toast notifications confirm every action

### 🧩 Format Tools

* Reusable format actions for `Format`, `Minify`, `Validate`, and `Sort Keys (JSON)`
* Works with common text and code inputs, not just JSON payloads
* Ideal for API payloads, config files, and source snippets

### 📁 File Import

* Drag and drop files directly onto either editor
* Supports common text, code, markup, config, and log file types
* Helpful for quick comparisons without manual copy and paste

### 🔎 Diff Workflow Tools

* Find text inside the rendered diff with live match highlighting
* Export comparison results as plain text or HTML for ticketing and sharing
* Ignore whitespace, case, and line-ending differences when comparing

### 💾 Session Recovery

* Restores left editor content after refresh
* Restores right editor content after refresh
* Restores the active Editors/Diff tab
* Keeps theme preference between sessions

### 🗂️ Supported File Types

* Text and logs: `.txt`, `.log`, `.md`, `.csv`
* Web and markup: `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less`, `.xml`
* JSON and config: `.json`, `.yaml`, `.yml`, `.ini`, `.conf`
* JavaScript and TypeScript: `.js`, `.ts`, `.jsx`, `.tsx`
* Common backend and scripting files: `.py`, `.java`, `.cs`, `.php`, `.rb`, `.go`, `.rs`, `.sh`, `.bat`, `.ps1`
* C-family and headers: `.c`, `.cc`, `.cpp`, `.h`, `.hpp`, `.cls`

### ⌨️ Keyboard Shortcuts

* `Ctrl/Cmd + Enter` → Compare
* `Ctrl/Cmd + L` → Clear
* `Ctrl/Cmd + Shift + C` → Copy diff
* `Ctrl/Cmd + D` → Toggle theme
* `Ctrl/Cmd + J` → Apply selected format tool
* `Ctrl/Cmd + 1 / 2` → Switch between Editors and Diff tabs
* Built-in shortcuts help modal available from the toolbar

### 🪄 Better Large-File UX

* `Comparing...` loading state during heavy diff rendering
* Debounced compare flow to avoid repeated renders from rapid clicks
* Wrap toggles in both Editors and Diff views for long-line handling

### 🌓 Dark / Light Theme

* Clean light theme for readability
* Developer-friendly dark mode
* Theme preference persisted locally across sessions

### 🧭 Tab-Based Workflow

* Input View – paste and edit content
* Diff View – focus on comparison results

### 🧼 Clear & Reset

* Clear inputs and diff results instantly
* Reset stats and UI state with one click

---

## 🖥️ UI Philosophy

DiffBoard is designed with:

* **Minimal distractions**
* **Clear visual hierarchy**
* **Keyboard-friendly layout**
* **Scrollable, non-clipping diff output**
* **No forced fullscreen** — users stay in control
* **Long-line resilience** with optional wrapping and loading feedback

---

## 📸 Screenshots

### 🔷 Light Mode

![Light Mode - Editor Page](./assets/screenshot/Editor%20Page-light.png)
![Light Mode - Diff View](./assets/screenshot/Diff%20Page-light.png)

### 🌑 Dark Mode

![Dark Mode - Editor Page](./assets/screenshot/Editor%20Page-dark.png)

---

## 🛠 Built With

* **HTML, CSS, JavaScript (Vanilla)**
* **jsdiff** – diff engine
* **Diff2Html** – GitHub-style diff rendering
* Chrome Extensions API (Manifest V3)
* Modular utility-based architecture

---

## 📦 Installation

### 🔧 Load DiffBoard Manually (Developer Mode)

1. **Clone or Download this Repository**

   ```bash
   git clone https://github.com/Kartikpatkar/diff-board.git
   ```

2. **Open Chrome Extensions Page**

   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**

   * Toggle **Developer mode** (top-right)

4. **Click “Load unpacked”**

   * Select the project root folder (contains `manifest.json`)

5. **Done 🎉**

   * Click the extension icon in Chrome to launch DiffBoard

> ✅ Works completely offline
> ✅ No login or external services required

---

## 🧪 Current Capabilities

✔ Text, code, JSON, and config comparison
✔ Drag-and-drop file import
✔ Broad support for common web, config, script, and source file types
✔ Reusable format tools
✔ Diff statistics and copy utilities
✔ Downloadable diff exports in TXT and HTML formats
✔ Search inside rendered diff results
✔ Ignore whitespace, case, and line-ending options
✔ Keyboard shortcuts and in-app shortcut help
✔ Dark / light themes
✔ Wrap toggles for editors and diff output
✔ Loading feedback for large comparisons
✔ Last-session editor and tab restore after refresh

---

## 🛣️ Roadmap (Planned Enhancements)

* 🧠 **VS Code–style Compare View**
* 🔗 Shareable diff export
* 📌 Save comparison history
* 💾 Remember recent comparisons

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

* Fork the repository
* Create a feature branch
* Submit a pull request

Please keep changes modular and follow existing code structure.

---

## 🧠 Author

Built by **Kartik Patkar**
🔗 GitHub • LinkedIn • Developer & Salesforce Consultant

---

## 📜 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

> **DiffBoard** — because comparing code should be simple, fast, and visual.
