function copyText(text, onSuccess, onError) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard
            .writeText(text)
            .then(onSuccess)
            .catch(onError);
        return;
    }

    onError?.();
}

export function initEditorActions({ leftEditor, rightEditor, diffOutput, safeBind, showToast, onAfterSwap }) {
    function swapEditorContents() {
        if (!leftEditor || !rightEditor) return false;

        const temp = leftEditor.value;
        leftEditor.value = rightEditor.value;
        rightEditor.value = temp;

        leftEditor.dispatchEvent(new Event("input", { bubbles: true }));
        rightEditor.dispatchEvent(new Event("input", { bubbles: true }));

        showToast?.("Editors swapped", "The content has been swapped between editors", "success");
        return true;
    }

    safeBind("swap-btn", swapEditorContents);
    safeBind("swap-editors-btn", swapEditorContents);
    safeBind("swap-in-diff", () => {
        if (swapEditorContents()) {
            onAfterSwap?.();
        }
    });

    safeBind("copy-left", () => {
        copyText(
            leftEditor.value,
            () => showToast?.("Copied", "Left editor copied", "success"),
            () => showToast?.("Copy Failed", "Unable to copy left editor", "error")
        );
    });

    safeBind("copy-right", () => {
        copyText(
            rightEditor.value,
            () => showToast?.("Copied", "Right editor copied", "success"),
            () => showToast?.("Copy Failed", "Unable to copy right editor", "error")
        );
    });

    safeBind("copy-diff", () => {
        copyText(
            diffOutput.innerText,
            () => showToast?.("Copied", "Full diff copied", "success"),
            () => showToast?.("Copy Failed", "Unable to copy full diff", "error")
        );
    });

    safeBind("copy-added", () => {
        const added = [...document.querySelectorAll(".d2h-ins")]
            .map((el) => el.innerText)
            .join("\n");

        copyText(
            added || "No added lines",
            () => showToast?.("Copied", "Added (+) lines copied", "success"),
            () => showToast?.("Copy Failed", "Unable to copy added lines", "error")
        );
    });

    safeBind("copy-removed", () => {
        const removed = [...document.querySelectorAll(".d2h-del")]
            .map((el) => el.innerText)
            .join("\n");

        copyText(
            removed || "No removed lines",
            () => showToast?.("Copied", "Removed (-) lines copied", "success"),
            () => showToast?.("Copy Failed", "Unable to copy removed lines", "error")
        );
    });
}
