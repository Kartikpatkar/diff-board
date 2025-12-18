# 🤝 Contributing to DiffBoard

Thank you for your interest in contributing to **DiffBoard**!
We welcome bug reports, feature requests, code improvements, UI/UX enhancements, documentation updates, and more.

DiffBoard is a developer-focused Chrome Extension, so clarity, performance, and user experience matter a lot.

---

## 🧩 Ways to Contribute

### 🐞 Report Bugs

If you encounter a bug, please open an issue with:

* A clear description of the issue
* Steps to reproduce the problem
* Expected behavior vs actual behavior
* Screenshots or screen recordings (if applicable)
* Browser and OS details (Chrome version, OS)

This helps us fix issues faster and more accurately.

---

### 💡 Suggest Enhancements

Have an idea to improve DiffBoard?
Open a feature request issue and explain:

* What problem it solves
* Why it improves the developer experience
* Any references (VS Code, GitHub, other tools)
* Mockups, wireframes, or screenshots (optional but helpful)

We especially welcome ideas related to:

* Diff visualization improvements
* Compare views (VS Code–style)
* Productivity shortcuts
* Performance and accessibility

---

### 💻 Submit Code

We accept pull requests for:

* Bug fixes
* New features
* UI/UX improvements
* Performance optimizations
* Refactoring and cleanup
* Documentation updates

**Please follow the existing project structure and coding style.**

---

## 🚀 Getting Started

To set up DiffBoard locally:

```bash
git clone https://github.com/Kartikpatkar/diff-board.git
cd diffboard
```

### Load the Extension in Chrome

1. Open Chrome and go to:

   ```
   chrome://extensions/
   ```
2. Enable **Developer Mode** (top-right)
3. Click **Load unpacked**
4. Select the project root folder (where `manifest.json` exists)

DiffBoard will now be available as a Chrome extension.

---

## ✅ Before Submitting a Pull Request

1. Fork the repository and create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make focused, well-scoped changes with clear commits.

3. Test your changes locally:

   * Compare multiple code samples
   * Test light and dark modes
   * Verify diff rendering and copy actions

4. Submit a pull request with:

   * A clear title and description
   * Screenshots for UI changes
   * References to related issues (e.g. `Closes #15`)

---

## 🧪 Testing Guidelines

If your change affects diff logic or rendering, please test with:

* Small and large files
* Added, removed, and modified lines
* JSON objects and arrays
* Edge cases (empty inputs, identical inputs)
* Dark and light themes

---

## 📚 Code Style Guide

* Keep JavaScript modular and readable
* Avoid inline scripts (Chrome Extension CSP)
* Use semantic naming for variables and functions
* Keep UI consistent with existing design
* Ensure new UI elements support dark mode

---

## 🙌 Code of Conduct

Please be respectful and inclusive.
We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) to foster a welcoming and collaborative environment.

---

## 📬 Questions or Discussions?

* Open an issue for questions or ideas
* GitHub Discussions may be enabled in the future

Thanks for contributing to **DiffBoard** 🚀
Your ideas and contributions help make it better for everyone.