export function registerKeyboardShortcuts({
    leftEditor,
    rightEditor,
    getActiveEditor,
    onCompare,
    onClear,
    onApplyFormat,
    onSwitchToEditors,
    onSwitchToDiff
}) {
    document.addEventListener("keydown", (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (!mod) return;

        // Compare: Ctrl/Cmd + Enter
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onCompare?.();
            return;
        }

        // Clear: Ctrl/Cmd + Shift + L
        if (e.shiftKey && e.key.toLowerCase() === "l") {
            e.preventDefault();
            onClear?.();
            return;
        }

        // Apply selected format tool: Ctrl/Cmd + J
        if (!e.shiftKey && e.key.toLowerCase() === "j") {
            e.preventDefault();
            const editor = getActiveEditor?.(leftEditor, rightEditor) || leftEditor;
            onApplyFormat?.(editor);
            return;
        }

        // Tab switching: Ctrl/Cmd + 1/2
        if (e.key === "1") {
            e.preventDefault();
            onSwitchToEditors?.();
            return;
        }

        if (e.key === "2") {
            e.preventDefault();
            onSwitchToDiff?.();
            return;
        }
    });
}
