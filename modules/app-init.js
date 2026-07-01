import { safeBind, getActiveEditor } from "./dom-helpers.js";
import { applyFormatAction } from "./format-tools.js";
import { registerKeyboardShortcuts } from "./keyboard-shortcuts.js";
import { initDiffEngine } from "./diff-engine.js";
import { initEditorActions } from "./editor-actions.js";
import { initUi } from "./ui-init.js";
import { initCompareWorkspace } from "./compare-workspace.js";

const LEFT_EDITOR_STORAGE_KEY = "editor-left-content";
const RIGHT_EDITOR_STORAGE_KEY = "editor-right-content";
const ACTIVE_TAB_STORAGE_KEY = "active-tab";

export function initApp() {
    const leftEditor = document.getElementById("left-editor");
    const rightEditor = document.getElementById("right-editor");
    const diffOutput = document.getElementById("diff2html-output");

    const showToast = (...args) => {
        if (typeof window.showToast === "function") {
            window.showToast(...args);
        }
    };

    const ui = initUi({ showToast });

    const diffEngine = initDiffEngine({
        leftEditor,
        rightEditor,
        diffOutput,
        safeBind,
        showToast
    });

    initEditorActions({
        leftEditor,
        rightEditor,
        diffOutput,
        safeBind,
        showToast,
        onAfterSwap: () => diffEngine.compareNow()
    });

    const compareWorkspace = initCompareWorkspace({
        leftEditor,
        rightEditor,
        showToast
    });

    // Load compare content when switching to Compare tab
    safeBind("compare-tab-btn", () => {
        compareWorkspace?.loadFromEditors();
    });

    function restoreEditorSession() {
        try {
            leftEditor.value = localStorage.getItem(LEFT_EDITOR_STORAGE_KEY) || "";
            rightEditor.value = localStorage.getItem(RIGHT_EDITOR_STORAGE_KEY) || "";
            
            // Restore checkboxes
            const ignoreWS = document.getElementById("ignore-whitespace");
            if (ignoreWS) ignoreWS.checked = localStorage.getItem("ignore-whitespace") === "true";
            const ignoreCase = document.getElementById("ignore-case");
            if (ignoreCase) ignoreCase.checked = localStorage.getItem("ignore-case") === "true";
            const ignoreLE = document.getElementById("ignore-line-endings");
            if (ignoreLE) ignoreLE.checked = localStorage.getItem("ignore-line-endings") === "true";

            // Restore selects
            const formatAction = document.getElementById("format-action");
            if (formatAction) formatAction.value = localStorage.getItem("format-action") || "format";
            const layoutSelect = document.getElementById("diff-layout-select");
            if (layoutSelect) layoutSelect.value = localStorage.getItem("diff-layout-select") || "side-by-side";

            return localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) || "editors";
        } catch {
            return "editors";
        }
    }

    function persistEditorContent() {
        try {
            localStorage.setItem(LEFT_EDITOR_STORAGE_KEY, leftEditor.value);
            localStorage.setItem(RIGHT_EDITOR_STORAGE_KEY, rightEditor.value);
        } catch {
            // Ignore storage errors and keep editing available.
        }
    }

    const restoredTab = restoreEditorSession();

    leftEditor.addEventListener("input", persistEditorContent);
    rightEditor.addEventListener("input", persistEditorContent);

    // Persist settings changes
    const ignoreWS = document.getElementById("ignore-whitespace");
    const ignoreCase = document.getElementById("ignore-case");
    const ignoreLE = document.getElementById("ignore-line-endings");
    const formatActionSelect = document.getElementById("format-action");
    const layoutSelect = document.getElementById("diff-layout-select");

    const saveOptions = () => {
        try {
            if (ignoreWS) localStorage.setItem("ignore-whitespace", String(ignoreWS.checked));
            if (ignoreCase) localStorage.setItem("ignore-case", String(ignoreCase.checked));
            if (ignoreLE) localStorage.setItem("ignore-line-endings", String(ignoreLE.checked));
            if (formatActionSelect) localStorage.setItem("format-action", formatActionSelect.value);
            if (layoutSelect) localStorage.setItem("diff-layout-select", layoutSelect.value);
        } catch {}
    };

    [ignoreWS, ignoreCase, ignoreLE].forEach(el => {
        el?.addEventListener("change", saveOptions);
    });
    formatActionSelect?.addEventListener("change", saveOptions);
    layoutSelect?.addEventListener("change", saveOptions);

    if (restoredTab === "diff" && (leftEditor.value.trim() || rightEditor.value.trim())) {
        diffEngine.compareNow();
    } else {
        diffEngine.switchTab(restoredTab);
    }


    function runFormatAction(targetEditor) {
        if (!targetEditor) return;
        const action = formatActionSelect?.value || "format";
        const result = applyFormatAction(targetEditor.value, action);

        if (result.success && typeof result.output === "string") {
            targetEditor.value = result.output;
        }

        showToast(result.title, result.message, result.type);
    }

    function runFormatActionForSelection() {
        const activeEditor = getActiveEditor(leftEditor, rightEditor);
        if (activeEditor) {
            runFormatAction(activeEditor);
            return;
        }

        runFormatAction(leftEditor);
        runFormatAction(rightEditor);
    }

    safeBind("format-apply", runFormatActionForSelection);

    safeBind("clear-btn", () => {
        if ((leftEditor.value || rightEditor.value) && !window.confirm("Are you sure you want to clear editors and reset all session data?")) {
            return;
        }
        leftEditor.value = "";
        rightEditor.value = "";
        diffEngine.clearDiff();

        try {
            localStorage.removeItem(LEFT_EDITOR_STORAGE_KEY);
            localStorage.removeItem(RIGHT_EDITOR_STORAGE_KEY);
        } catch {
            // Ignore storage errors and keep clear behavior working.
        }

        diffEngine.switchTab("editors");
        showToast("Cleared", "Editors & diff reset", "info");
    });

    registerKeyboardShortcuts({
        leftEditor,
        rightEditor,
        getActiveEditor,
        onCompare: () => diffEngine.compareNow(),
        onClear: () => document.getElementById("clear-btn")?.click(),
        onCopyDiff: () => document.getElementById("copy-diff")?.click(),
        onToggleTheme: () => ui?.toggleTheme?.(),
        onApplyFormat: runFormatAction,
        onSwitchToEditors: () => diffEngine.switchTab("editors"),
        onSwitchToDiff: () => diffEngine.switchTab("diff"),
        onSwitchToCompare: () => {
            diffEngine.switchTab("compare");
            compareWorkspace?.loadFromEditors();
        }
    });
}
