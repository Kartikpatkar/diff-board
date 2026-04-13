# 🔀 DiffBoard – Code Comparison Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.1.0-blue.svg)](#)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg?logo=google-chrome)](#)

> **Tagline**: *Compare code, text, and JSON like a developer — fast, visual, and distraction-free.*

---

## ✨ Overview

**DiffBoard** is a modern, developer-friendly **Chrome Extension** that opens in a new tab and helps you **compare code, text, and JSON** with a clean UI and powerful diff visualization.

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

* Paste **Original** and **Modified** content
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
* Toast notifications confirm every action

### 🧩 JSON Mode

* One-click JSON formatter
* Pretty-prints both inputs
* Ideal for API payload comparison

### 🌓 Dark / Light Theme

* Clean light theme for readability
* Developer-friendly dark mode
* Theme preference persisted using Chrome Storage

### 🧭 Tab-Based Workflow

* Input View – paste and edit content
* Diff View – focus on comparison results
* (Planned) Compare View – advanced VS-Code-style diff with merge controls

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

   * Open a new tab or click the extension icon to launch DiffBoard

> ✅ Works completely offline
> ✅ No login or external services required

---

## 🧪 Current Capabilities

✔ Text comparison
✔ Code comparison
✔ JSON formatting
✔ Diff statistics
✔ Copy utilities
✔ Dark / light themes
✔ Chrome new-tab integration

---

## 🛣️ Roadmap (Planned Enhancements)

* 🧠 **VS Code–style Compare View**

  * Editable side-by-side editors
  * Inline merge arrows
  * Real-time diff updates
* 📁 File import (local files)
* 🔗 Shareable diff export
* ⌨️ Keyboard shortcuts
* 📌 Save comparison history

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
