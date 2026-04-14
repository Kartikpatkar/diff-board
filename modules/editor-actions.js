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

const SUPPORTED_FILE_EXTENSIONS = new Set([
    ".json",
    ".txt",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".xml",
    ".yaml",
    ".yml",
    ".md",
    ".csv",
    ".sql",
    ".py",
    ".java",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".sh",
    ".bat",
    ".ps1",
    ".ini",
    ".conf",
    ".log",
    ".cls"
]);

const SUPPORTED_FILE_TYPES_MESSAGE = `Supported types: ${[...SUPPORTED_FILE_EXTENSIONS].join(", ")}`;

function getExtension(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.slice(lastDot).toLowerCase();
}

function isSupportedTextFile(file) {
    if (!file) return false;
    return SUPPORTED_FILE_EXTENSIONS.has(getExtension(file.name));
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
        reader.readAsText(file);
    });
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

    function bindFileDrop(editor, label) {
        const panel = editor?.closest(".editor-panel");
        if (!editor || !panel) return;

        const setDragState = (isActive) => {
            panel.classList.toggle("is-dragover", isActive);
        };

        panel.addEventListener("dragenter", (event) => {
            event.preventDefault();
            setDragState(true);
        });

        panel.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragState(true);
        });

        panel.addEventListener("dragleave", (event) => {
            if (!panel.contains(event.relatedTarget)) {
                setDragState(false);
            }
        });

        panel.addEventListener("drop", async (event) => {
            event.preventDefault();
            setDragState(false);

            const [file] = event.dataTransfer?.files || [];
            if (!file) return;

            if (!isSupportedTextFile(file)) {
                showToast?.(
                    "Unsupported File",
                    SUPPORTED_FILE_TYPES_MESSAGE,
                    "error"
                );
                return;
            }

            try {
                editor.value = await readFileAsText(file);
                editor.dispatchEvent(new Event("input", { bubbles: true }));
                showToast?.("File Loaded", `${file.name} loaded into ${label}`, "success");
            } catch (error) {
                showToast?.("Read Failed", error.message || `Unable to read ${file.name}`, "error");
            }
        });
    }

    bindFileDrop(leftEditor, "Original Code");
    bindFileDrop(rightEditor, "Modified Code");
}
