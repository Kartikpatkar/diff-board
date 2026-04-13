import { safeBind, getActiveEditor } from "./dom-helpers.js";
import { applyFormatAction } from "./format-tools.js";
import { registerKeyboardShortcuts } from "./keyboard-shortcuts.js";
import { initDiffEngine } from "./diff-engine.js";
import { initEditorActions } from "./editor-actions.js";
import { initUi } from "./ui-init.js";

export function initApp() {
    const leftEditor = document.getElementById("left-editor");
    const rightEditor = document.getElementById("right-editor");
    const diffOutput = document.getElementById("diff2html-output");

    const showToast = (...args) => {
        if (typeof window.showToast === "function") {
            window.showToast(...args);
        }
    };

    initUi({ showToast });

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

    const formatActionSelect = document.getElementById("format-action");

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
        leftEditor.value = "";
        rightEditor.value = "";
        diffOutput.innerHTML = "";

        diffEngine.switchTab("editors");
        showToast("Cleared", "Editors & diff reset", "info");
    });

    registerKeyboardShortcuts({
        leftEditor,
        rightEditor,
        getActiveEditor,
        onCompare: () => diffEngine.compareNow(),
        onClear: () => document.getElementById("clear-btn")?.click(),
        onApplyFormat: runFormatAction,
        onSwitchToEditors: () => diffEngine.switchTab("editors"),
        onSwitchToDiff: () => diffEngine.switchTab("diff")
    });
}
