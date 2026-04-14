# Changelog

All notable changes to DiffBoard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- _No unreleased changes._

## [1.1.3] - 2026-04-14

### Added
- **Session restore** - Restores the last editor contents and active tab after refresh so work-in-progress comparisons are not lost.
- **Diff download export** - Added `Download Diff` support with `diff.txt` and `diff.html` export formats.
- **Find in diff** - Added in-diff search with live match highlighting for rendered comparison results.
- **Ignore compare options** - Added toggles for ignoring whitespace, case, and line-ending differences during comparison.
- **Diff tools guidance** - Expanded the shortcuts/help modal to explain in-diff search, export formats, and ignore options.

### Fixed
- **Refresh continuity** - Preserved the active workspace state instead of resetting the interface after page reload.

## [1.1.2] - 2026-04-14

### Added
- **Drag-and-drop file import** - Added direct file drop support for the left and right editors, including common code, text, markup, config, and log file formats.
- **Shortcuts help modal** - Added a toolbar shortcuts button that opens an in-app keyboard shortcuts reference for discoverability.
- **Wrap controls** - Added Wrap toggles in both the editor footer and diff header so long lines can be wrapped on demand.

### Changed
- **Keyboard shortcut set** - Expanded the shortcut mappings to include compare, clear, copy diff, theme toggle, format apply, and tab switching.
- **Formatting workflow messaging** - Kept drag-and-drop validation and unsupported-file messaging in sync with the shared supported extension list.

### Fixed
- **Large diff feedback** - Added a visible `Comparing...` loading indicator before heavy diff rendering begins.
- **Repeated compare triggers** - Debounced compare requests and blocked overlapping renders from rapid repeated clicks or shortcuts.
- **Long-line overflow** - Enabled optional wrapping for editor content and rendered diff output to prevent horizontal overflow.
- **Loading overlay visibility** - Fixed the compare overlay so it hides correctly after rendering completes.

## [1.1.1] - 2026-04-14

### Added
- **Toolbar branding icon** - Added the application icon to the top toolbar before the DiffBoard title for stronger product branding.

### Fixed
- **Manifest icon mappings** - Updated Chrome extension icon mappings to use resolution-specific assets for `16`, `32`, `48`, and `128` sizes.
- **Missing 128px icon asset** - Restored the required `128x128` icon file and aligned the toolbar/action icon setup with the generated asset set.

## [1.1.0] - 2026-04-13

### Added
- **Generic format tools** - Replaced the JSON-only action with a reusable formatting workflow that supports:
  - `Format`
  - `Minify`
  - `Validate`
  - `Sort Keys (JSON)`
- **Keyboard shortcuts** - Added shortcuts for compare, clear, format apply, and tab switching.
- **Modular JavaScript architecture** - Broke the app logic into focused modules for:
  - app initialization
  - library loading
  - diff engine logic
  - editor actions
  - UI initialization
  - keyboard shortcuts
  - format tools
- **SVG icon sprite** - Extracted repeated inline SVG icons into a shared sprite file for reusable UI icons.
- **Keep a Changelog support** - Added a dedicated `CHANGELOG.md` to track releases and changes over time.

### Changed
- **Project structure refactor** - Renamed the main UI folder from `newtab` to `app`.
- **Folder layout cleanup** - Restructured the project so `app/` contains only:
  - `index.html`
  - `index.css`
  - `index.js`
- **Shared assets moved to root** - Moved common folders to the repository root:
  - `assets/`
  - `background/`
  - `libs/`
  - `modules/`
  - `styles/`
  - `utils/`
- **Formatting action semantics** - Renamed the old `json-toggle` action to `format-apply` for clearer intent.
- **Entrypoint simplification** - Reduced `app/index.js` to a small coordinator that initializes the app after dependency loading.
- **CSS loading cleanup** - Removed duplicated stylesheet imports to avoid double-loading and conflicting rules.
- **Icon rendering strategy** - Replaced repeated inline button icons in the app UI with references to the shared sprite.

### Removed
- **Unused editor/runtime libraries** - Removed unused libraries and bundles, including non-active editor runtimes and auxiliary UI libraries.
- **Dead utilities and stale imports** - Removed utility files and references that were no longer part of the current runtime path.
- **macOS metadata files** - Removed `.DS_Store` files from the project tree.

### Fixed
- **Manifest and runtime paths** - Updated manifest, service worker, README asset paths, and runtime imports to match the new structure.
- **Extension compatibility after refactor** - Preserved the MV3 extension workflow after folder migration and module extraction.
- **Asset reference consistency** - Ensured icons, styles, modules, utilities, and diff libraries resolve correctly from the new layout.

---

## Version History Summary

- **1.1.3** (Apr 2026) - Session recovery, diff export, in-diff search, ignore options, and updated in-app guidance.
- **1.1.2** (Apr 2026) - File drag-and-drop, expanded shortcuts, wrap controls, loading feedback, and debounced compare rendering.
- **1.1.1** (Apr 2026) - Toolbar branding polish and finalized extension icon asset mappings.
- **1.1.0** (Apr 2026) - Major refactor: modular architecture, generic format tools, keyboard shortcuts, SVG sprite icons, and full project structure cleanup.
- **1.0.1** - Previous pre-refactor release before the architecture and folder-layout overhaul.

---

[Unreleased]: https://github.com/Kartikpatkar/diff-board/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/Kartikpatkar/diff-board/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Kartikpatkar/diff-board/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Kartikpatkar/diff-board/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Kartikpatkar/diff-board/compare/v1.0.1...v1.1.0
