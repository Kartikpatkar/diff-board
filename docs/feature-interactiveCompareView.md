# 🚀 Feature Specification: Interactive Compare Workspace (VS Code Inspired)

## Background

We are building a Chrome Extension called **DiffBoard**.

Current version: **v1.2.0**

DiffBoard is already a mature code comparison tool with the following features:

* Editors tab
* Diff tab
* Side-by-side diff
* Unified diff
* Search inside diff
* Session recovery
* Keyboard shortcuts
* File drag & drop
* Copy utilities
* Export utilities
* Ignore whitespace/case/line endings
* Format/Minify/Validate tools
* Theme support
* Syntax highlighting
* Offline architecture

**IMPORTANT**

This new feature MUST NOT modify or break any existing functionality.

The Editors tab and Diff tab must continue to behave exactly as they do today.

We are ADDING a completely new workflow.

---

# Objective

Create a brand-new third workspace called:

```
Compare
```

Navigation becomes:

```
Editors | Diff | Compare
```

The Compare workspace is **NOT** another diff viewer.

It is an **interactive merge workspace**, similar to:

* VS Code Compare
* GitHub PR Review
* Beyond Compare

Users should be able to:

* Compare
* Edit
* Merge
* Resolve differences

without leaving DiffBoard.

---

# Product Philosophy

Current Diff tab answers:

> "What changed?"

Compare Workspace should answer:

> "How do I resolve these changes?"

---

# IMPORTANT REQUIREMENTS

## Existing Features

Must remain untouched.

Do NOT modify:

* Diff rendering
* Existing Compare button
* Editors
* Search
* Export
* Copy
* Shortcuts
* Theme
* Session Recovery

Everything should continue working exactly the same.

The Compare Workspace should be isolated.

---

# New Architecture

Create a completely separate module.

Do NOT mix logic with existing Diff tab.

---

# UI Layout

```
-------------------------------------------------

Toolbar

-------------------------------------------------

LEFT EDITOR        MERGE        RIGHT EDITOR

┌─────────────┐     │      ┌─────────────┐
│             │     │      │             │
│ Monaco      │ ← → │      │ Monaco      │
│ Editor      │     │      │ Editor      │
│             │     │      │             │
└─────────────┘     │      └─────────────┘

-------------------------------------------------

Status Bar

-------------------------------------------------
```

---

# Editor

Use Monaco Editors.

One editor on left.

One editor on right.

Load current content from:

Editors tab.

No copy-paste required.

Opening Compare automatically loads:

Original

↓

Left

Modified

↓

Right

---

# Live Editing

Both editors must remain editable.

As user types:

Compare updates automatically.

Use:

```
300ms debounce
```

Never require pressing Compare.

---

# Diff Engine

Continue using:

```
jsdiff
```

Do NOT replace current engine.

Generate diff continuously.

Update decorations only.

Do NOT recreate Monaco editor.

---

# Change Decorations

Decorate editor using Monaco decorations.

Green

```
Added
```

Red

```
Removed
```

Blue

```
Modified
```

Exactly like VS Code.

---

# Merge Column

Between editors.

Each changed block should show:

```
←

→
```

Buttons.

---

## Left Arrow

Copies

Right

↓

Left

Entire block.

---

## Right Arrow

Copies

Left

↓

Right

Entire block.

---

# Merge Granularity

Phase 1

Whole changed block.

NOT individual lines.

Future versions can support:

Single-line merge.

---

# Scroll Synchronization

Very important.

Scrolling left

↓

Scroll right

to matching location.

Do NOT simply sync percentages.

Sync corresponding change blocks.

---

# Previous / Next Change

Toolbar:

```
↑

↓

```

Move cursor to:

Previous change

Next change

Center in viewport.

---

# Change Counter

Top toolbar:

```
+18

-12

~6
```

Clicking any value

↓

Jump to first matching change.

---

# Auto Compare

Toggle.

```
ON
```

Every edit

↓

Refresh decorations.

```
OFF
```

Manual refresh button.

---

# Compare Toolbar

Include:

```
Compare

Search

Ignore WS

Ignore Case

Wrap

Auto Compare

Swap

Export

```

---

# Search

Search both editors.

Highlight results.

Support:

Next

Previous

---

# File Information

Above each editor.

Example

```
Old.json

JSON

14 KB

120 lines
```

Right

```
New.json

JSON

18 KB

145 lines
```

If manually pasted,

show

```
Untitled
```

---

# Status Bar

Bottom.

Display:

```
Language

Encoding

Line Count

Change Count

Cursor Position

```

---

# Merge Actions

Toolbar:

```
Accept All →

Accept All ←

Reset Compare

```

Accept All →

Copy everything

Left

↓

Right

Accept All ←

Copy everything

Right

↓

Left

---

# Performance

Must support:

```
10,000+

Lines
```

without freezing.

Never recreate editors.

Only update:

Decorations.

---

# Keyboard Shortcuts

Reuse existing.

Add:

```
Alt + →

Merge block right

Alt + ←

Merge block left

F7

Previous change

Shift + F7

Next change

```

---

# Theme

Must automatically inherit

Existing:

Dark

Light

themes.

No duplicate CSS.

---

# Session

Do NOT modify existing session recovery.

Compare Workspace should read from

Editors.

No separate storage.

---

# Export

Allow:

```
Merged Result

↓

Copy

Download

Open back in Editors
```

---

# Future Compatibility

Architecture should make it easy to add:

* AI Change Summary
* Conflict resolution
* Three-way merge
* Git patch review

without major refactoring.

---

# UX Goals

The Compare Workspace should feel like:

* VS Code
* GitHub Pull Request review
* Beyond Compare

but simplified for browser users.

The user should immediately understand:

* where changes exist
* how to navigate changes
* how to merge changes
* how to export the final result

---

# Non-Functional Requirements

* Maintain current project architecture.
* Do not break any existing feature.
* Do not regress performance.
* Keep all code modular and reusable.
* Follow the existing coding style.
* Use CSP-safe JavaScript compatible with Chrome Manifest V3.
* Preserve offline-first behavior.
* Ensure the Compare Workspace integrates seamlessly with the existing Editors and Diff tabs.

---

## Development Strategy (Very Important)

This feature **must not be implemented in one large commit**.

Implement it incrementally:

### Phase 1

* Create the Compare tab and layout.
* Load Monaco editors with current editor content.
* Implement synchronized scrolling and live editing.

### Phase 2

* Add Monaco diff decorations.
* Add previous/next change navigation.
* Display change counters.

### Phase 3

* Implement block-level merge arrows.
* Add merge all actions.
* Add export merged result.

### Phase 4

* Polish the UX, optimize performance, refine keyboard shortcuts, and prepare the architecture for future enhancements like AI summaries and three-way merge support.

---

## My Final Recommendation

One suggestion I'd make beyond the prompt: **don't call this feature "Compare View" in the UI.** Call it **"Compare"** or **"Workspace"**. The Diff tab remains your read-only review screen, while **Compare** becomes the interactive editing and merge environment. This distinction will make DiffBoard feel much more polished and intuitive.

---

## Status: Fully Implemented (v1.3.0)

All phases of this specification have been successfully implemented:
* **Interactive Compare Workspace**: A side-by-side editing panel integrated as the 3rd tab in the UI.
* **Diff Engine & Live Updates**: Continuous, debounced (300ms) recalculations of changes using `jsdiff` with custom high-performance textareas and absolute overlay decorations.
* **Scroll Sync**: Proportional block-aligned sync across the editors and the gutter.
* **Merge Utilities**: Gutter-level merge buttons (`←` / `→`), bulk merge action dropdowns, and keyboard shortcuts (`Alt+ArrowLeft` / `Alt+ArrowRight`).
* **Navigation**: Toolbar arrows, clickable stat badges, and keyboard shortcuts (`F7` / `Shift+F7`).
* **History Stack**: Undo/Redo operations (`Ctrl+Z` / `Ctrl+Y`) supporting up to 50 revision states.
* **Exporting**: Dropdown for copying/downloading raw content, and copying back to the Editors tab.
