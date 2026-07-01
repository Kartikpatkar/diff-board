/**
 * Compare Workspace Module — Phase 2, 3, & 4
 *
 * Self-contained interactive merge workspace.
 * Reads content from the Editors tab textareas.
 * Provides live diff, block-based synchronized scrolling, line-level decorations,
 * block-level merging, navigation, search, and export capabilities.
 */

const COMPARE_DEBOUNCE_MS = 300;

/**
 * Compute line-level diff stats from two strings using jsdiff.
 */
function computeCompareStats(leftText, rightText, options) {
    if (!window.Diff) {
        return { added: 0, removed: 0, modified: 0, changes: [] };
    }

    let left = leftText;
    let right = rightText;

    if (options.ignoreLineEndings) {
        left = left.replace(/\r\n?/g, "\n");
        right = right.replace(/\r\n?/g, "\n");
    }

    const diffResult = window.Diff.diffLines(left, right, {
        ignoreWhitespace: options.ignoreWhitespace,
        ignoreCase: options.ignoreCase
    });

    let added = 0;
    let removed = 0;
    const changes = [];

    diffResult.forEach((part) => {
        const lineCount = part.count || 0;
        if (part.added) {
            added += lineCount;
            changes.push({ type: "added", count: lineCount, value: part.value });
        } else if (part.removed) {
            removed += lineCount;
            changes.push({ type: "removed", count: lineCount, value: part.value });
        } else {
            changes.push({ type: "equal", count: lineCount, value: part.value });
        }
    });

    const modified = Math.min(added, removed);

    return { added, removed, modified, changes };
}

/**
 * Compute file info from text content.
 */
function computeFileInfo(text, label) {
    const lines = text ? text.split("\n").length : 0;
    const sizeBytes = new Blob([text]).size;
    let sizeLabel;

    if (sizeBytes < 1024) {
        sizeLabel = `${sizeBytes} B`;
    } else if (sizeBytes < 1024 * 1024) {
        sizeLabel = `${(sizeBytes / 1024).toFixed(1)} KB`;
    } else {
        sizeLabel = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { name: label || "Untitled", lines, size: sizeLabel };
}

/**
 * Build line decoration data from diff changes.
 * Returns { leftDecorations: [], rightDecorations: [] }
 * Each entry: { lineStart, lineCount, type }
 */
function buildLineDecorations(changes) {
    const leftDecorations = [];
    const rightDecorations = [];
    let leftLine = 0;
    let rightLine = 0;

    for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        if (change.type === "equal") {
            leftLine += change.count;
            rightLine += change.count;
        } else if (change.type === "removed") {
            leftDecorations.push({ lineStart: leftLine, lineCount: change.count, type: "removed" });
            leftLine += change.count;

            if (i + 1 < changes.length && changes[i + 1].type === "added") {
                const addedChange = changes[i + 1];
                leftDecorations[leftDecorations.length - 1].type = "modified";
                rightDecorations.push({ lineStart: rightLine, lineCount: addedChange.count, type: "modified" });
                rightLine += addedChange.count;
                i++;
            }
        } else if (change.type === "added") {
            rightDecorations.push({ lineStart: rightLine, lineCount: change.count, type: "added" });
            rightLine += change.count;
        }
    }

    return { leftDecorations, rightDecorations };
}

/**
 * Render line decoration elements into a decoration container.
 * Each decoration div is positioned relative to the overall height.
 */
function renderDecorations(container, decorations, lineHeight, scrollHeight, activeBlock, side) {
    container.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "compare-line-decorations-inner";
    inner.style.position = "relative";
    inner.style.height = scrollHeight + "px";

    decorations.forEach((dec) => {
        const div = document.createElement("div");

        // Determine if this decoration block is currently the active selected block
        let isActive = false;
        if (activeBlock) {
            if (side === "left" && dec.lineStart === activeBlock.leftStartLine && dec.lineCount === activeBlock.leftCount) {
                isActive = true;
            } else if (side === "right" && dec.lineStart === activeBlock.rightStartLine && dec.lineCount === activeBlock.rightCount) {
                isActive = true;
            }
        }

        div.className = `compare-line-decoration compare-line-${dec.type}${isActive ? ' compare-line-active' : ''}`;
        const top = dec.lineStart * lineHeight;
        const height = dec.lineCount * lineHeight;
        div.style.cssText = `position:absolute;top:${top + 12}px;height:${height}px;left:0;right:0;`;
        inner.appendChild(div);
    });

    container.appendChild(inner);
}

function getLineHeight(textarea) {
    const computed = window.getComputedStyle(textarea);
    const dummy = document.createElement("div");
    dummy.style.cssText = `
        position: absolute;
        visibility: hidden;
        font-family: ${computed.fontFamily};
        font-size: ${computed.fontSize};
        line-height: ${computed.lineHeight};
        padding: 0;
        margin: 0;
        white-space: pre;
    `;
    dummy.textContent = "A";
    document.body.appendChild(dummy);
    const height = dummy.clientHeight;
    document.body.removeChild(dummy);
    return height || 20;
}

/**
 * Helper to compute character offset of a line.
 */
function getCharOffsetOfLine(text, lineIndex) {
    const lines = text.split("\n");
    let offset = 0;
    for (let i = 0; i < Math.min(lineIndex, lines.length); i++) {
        offset += lines[i].length + 1; // +1 for the newline character
    }
    return offset;
}

/**
 * Initialize the Compare Workspace.
 */
export function initCompareWorkspace({ leftEditor, rightEditor, showToast }) {
    // DOM references
    const compareLeftEditor = document.getElementById("compare-left-editor");
    const compareRightEditor = document.getElementById("compare-right-editor");
    const leftFileInfo = document.getElementById("compare-left-file-info");
    const rightFileInfo = document.getElementById("compare-right-file-info");
    const leftDecorContainer = document.getElementById("compare-left-decorations");
    const rightDecorContainer = document.getElementById("compare-right-decorations");
    const compareMergeGutter = document.getElementById("compare-merge-gutter");

    // Stats elements
    const statAdded = document.getElementById("compare-stat-added");
    const statRemoved = document.getElementById("compare-stat-removed");
    const statModified = document.getElementById("compare-stat-modified");

    // Status bar
    const statusLines = document.getElementById("compare-status-lines");
    const statusChanges = document.getElementById("compare-status-changes");
    const statusCursor = document.getElementById("compare-status-cursor");

    // Toolbar controls
    const autoCompareToggle = document.getElementById("compare-auto-toggle");
    const swapBtn = document.getElementById("compare-swap-btn");
    const ignoreSelect = document.getElementById("compare-ignore-select");
    const wrapToggle = document.getElementById("compare-wrap-toggle");

    // Navigation buttons
    const prevChangeBtn = document.getElementById("compare-prev-change");
    const nextChangeBtn = document.getElementById("compare-next-change");

    // Merge Actions
    const mergeActionSelect = document.getElementById("compare-merge-action-select");

    // Export Selector
    const exportSelect = document.getElementById("compare-export-select");
    // Search
    const searchInput = document.getElementById("compare-search-input");
    const searchCount = document.getElementById("compare-search-count");

    if (!compareLeftEditor || !compareRightEditor) return;

    let debounceTimer = null;
    let autoCompare = true;
    let lastChanges = [];
    let lastLeftDecorations = [];
    let lastRightDecorations = [];
    let activeBlocks = [];
    let currentBlockIndex = -1;
    let isSyncingScroll = false;
    let leftFileName = "Original";
    let rightFileName = "Modified";

    // History (Undo / Redo)
    let history = [];
    let historyIndex = -1;
    let isRestoringHistory = false;

    const undoBtn = document.getElementById("compare-undo-btn");
    const redoBtn = document.getElementById("compare-redo-btn");

    function updateUndoRedoButtons() {
        if (undoBtn) undoBtn.disabled = historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = historyIndex < 0 || historyIndex >= history.length - 1;
    }

    function saveHistoryState() {
        const currentState = {
            left: compareLeftEditor.value,
            right: compareRightEditor.value
        };

        if (historyIndex >= 0) {
            const lastState = history[historyIndex];
            if (lastState.left === currentState.left && lastState.right === currentState.right) {
                return;
            }
        }

        history = history.slice(0, historyIndex + 1);
        history.push(currentState);
        historyIndex = history.length - 1;

        updateUndoRedoButtons();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreHistoryState(history[historyIndex]);
            showToast?.("Undo", "Reverted last action", "info");
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            restoreHistoryState(history[historyIndex]);
            showToast?.("Redo", "Restored undone action", "info");
        }
    }

    function restoreHistoryState(state) {
        isRestoringHistory = true;
        compareLeftEditor.value = state.left;
        compareRightEditor.value = state.right;
        
        compareLeftEditor.dispatchEvent(new Event("input", { bubbles: true }));
        compareRightEditor.dispatchEvent(new Event("input", { bubbles: true }));
        isRestoringHistory = false;

        runCompare();
        updateUndoRedoButtons();
    }

    // Backup copy for resetting compare workspace
    let originalLeftContent = "";
    let originalRightContent = "";

    // ── Load content from Editors tab ──────────────────────────

    function loadFromEditors() {
        compareLeftEditor.value = leftEditor?.value || "";
        compareRightEditor.value = rightEditor?.value || "";

        originalLeftContent = compareLeftEditor.value;
        originalRightContent = compareRightEditor.value;

        // Retrieve file names from data attribute on the source editors
        leftFileName = leftEditor?.dataset?.fileName || "Original";
        rightFileName = rightEditor?.dataset?.fileName || "Modified";

        // Reset navigation and history states
        currentBlockIndex = -1;
        history = [];
        historyIndex = -1;
        saveHistoryState();

        updateFileInfo();
        runCompare();
    }

    // ── File info ──────────────────────────────────────────────

    function updateFileInfo() {
        const leftInfo = computeFileInfo(compareLeftEditor.value, leftFileName);
        const rightInfo = computeFileInfo(compareRightEditor.value, rightFileName);

        if (leftFileInfo) {
            const nameEl = leftFileInfo.querySelector(".compare-file-name");
            const metaEl = leftFileInfo.querySelector(".compare-file-meta");
            if (nameEl) nameEl.textContent = leftInfo.name;
            if (metaEl) metaEl.innerHTML = `<span>${leftInfo.size}</span><span>${leftInfo.lines} lines</span>`;
        }

        if (rightFileInfo) {
            const nameEl = rightFileInfo.querySelector(".compare-file-name");
            const metaEl = rightFileInfo.querySelector(".compare-file-meta");
            if (nameEl) nameEl.textContent = rightInfo.name;
            if (metaEl) metaEl.innerHTML = `<span>${rightInfo.size}</span><span>${rightInfo.lines} lines</span>`;
        }

        // Update status bar line count
        if (statusLines) {
            statusLines.textContent = `${leftInfo.lines} / ${rightInfo.lines}`;
        }
    }

    // ── Compare Options ────────────────────────────────────────

    function getCompareOptions() {
        const val = ignoreSelect?.value || "none";
        return {
            ignoreWhitespace: val === "ignore-ws" || val === "ignore-both",
            ignoreCase: val === "ignore-case" || val === "ignore-both",
            ignoreLineEndings: true
        };
    }

    // ── Run Compare ────────────────────────────────────────────

    function runCompare() {
        const leftText = compareLeftEditor.value;
        const rightText = compareRightEditor.value;
        const options = getCompareOptions();

        const stats = computeCompareStats(leftText, rightText, options);
        lastChanges = stats.changes;

        // Group into actual contiguous blocks (ignoring equal lines)
        activeBlocks = [];
        let leftLine = 0;
        let rightLine = 0;

        for (let i = 0; i < lastChanges.length; i++) {
            const change = lastChanges[i];
            if (change.type === "equal") {
                leftLine += change.count;
                rightLine += change.count;
            } else if (change.type === "removed") {
                const block = {
                    leftStartLine: leftLine,
                    leftCount: change.count,
                    rightStartLine: rightLine,
                    rightCount: 0,
                    type: "removed",
                    valueLeft: change.value,
                    valueRight: ""
                };
                leftLine += change.count;

                // Merge contiguous removed + added into a modified block
                if (i + 1 < lastChanges.length && lastChanges[i + 1].type === "added") {
                    const addedChange = lastChanges[i + 1];
                    block.rightCount = addedChange.count;
                    block.valueRight = addedChange.value;
                    block.type = "modified";
                    rightLine += addedChange.count;
                    i++;
                }
                activeBlocks.push(block);
            } else if (change.type === "added") {
                const block = {
                    leftStartLine: leftLine,
                    leftCount: 0,
                    rightStartLine: rightLine,
                    rightCount: change.count,
                    type: "added",
                    valueLeft: "",
                    valueRight: change.value
                };
                rightLine += change.count;
                activeBlocks.push(block);
            }
        }

        // Update stats counters
        let addedCount = 0;
        let removedCount = 0;
        let modifiedCount = 0;
        activeBlocks.forEach(b => {
            if (b.type === "added") addedCount += b.rightCount;
            else if (b.type === "removed") removedCount += b.leftCount;
            else if (b.type === "modified") {
                addedCount += b.rightCount;
                removedCount += b.leftCount;
                modifiedCount += Math.min(b.leftCount, b.rightCount);
            }
        });

        if (statAdded) statAdded.textContent = `+${addedCount}`;
        if (statRemoved) statRemoved.textContent = `−${removedCount}`;
        if (statModified) statModified.textContent = `~${modifiedCount}`;
        if (statusChanges) statusChanges.textContent = String(activeBlocks.length);

        // Build and render decorations
        const { leftDecorations, rightDecorations } = buildLineDecorations(lastChanges);
        lastLeftDecorations = leftDecorations;
        lastRightDecorations = rightDecorations;

        // Keep current block index bounds checked
        if (currentBlockIndex >= activeBlocks.length) {
            currentBlockIndex = activeBlocks.length - 1;
        }

        if (!isRestoringHistory) {
            saveHistoryState();
        }

        renderAllDecorations();
        renderMergeGutter();
        updateFileInfo();
        syncAllViewsScroll();
    }

    function renderAllDecorations() {
        if (!leftDecorContainer || !rightDecorContainer) return;

        const leftLH = getLineHeight(compareLeftEditor);
        const rightLH = getLineHeight(compareRightEditor);

        const activeBlock = activeBlocks[currentBlockIndex];

        const leftLines = compareLeftEditor.value.split("\n").length;
        const rightLines = compareRightEditor.value.split("\n").length;

        const leftHeight = leftLines * leftLH + 24;
        const rightHeight = rightLines * rightLH + 24;

        renderDecorations(leftDecorContainer, lastLeftDecorations, leftLH, leftHeight, activeBlock, "left");
        renderDecorations(rightDecorContainer, lastRightDecorations, rightLH, rightHeight, activeBlock, "right");
    }

    function scheduleCompare() {
        if (!autoCompare) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            runCompare();
        }, COMPARE_DEBOUNCE_MS);
    }

    // ── Gutter Merging ──────────────────────────────────────────

    function renderMergeGutter() {
        if (!compareMergeGutter) return;
        compareMergeGutter.innerHTML = "";

        const leftLH = getLineHeight(compareLeftEditor);
        const leftLines = compareLeftEditor.value.split("\n").length;
        const leftHeight = leftLines * leftLH + 24;

        const inner = document.createElement("div");
        inner.className = "compare-merge-gutter-inner";
        inner.style.position = "relative";
        inner.style.height = leftHeight + "px";

        if (activeBlocks.length === 0) {
            const placeholder = document.createElement("div");
            placeholder.className = "compare-merge-gutter-placeholder";
            placeholder.textContent = "MERGE";
            compareMergeGutter.appendChild(placeholder);
            return;
        }

        activeBlocks.forEach((block) => {
            const btnGroup = document.createElement("div");
            btnGroup.style.position = "absolute";
            btnGroup.style.left = "0";
            btnGroup.style.right = "0";
            btnGroup.style.display = "flex";
            btnGroup.style.justifyContent = "center";
            btnGroup.style.gap = "2px";

            // Center vertically within the block's left height
            const height = Math.max(block.leftCount, 1) * leftLH;
            const top = (block.leftStartLine * leftLH) + (height - 22) / 2 + 12; // 22px height, 12px padding
            btnGroup.style.top = `${top}px`;

            if (block.type === "removed" || block.type === "modified") {
                const btnRight = document.createElement("button");
                btnRight.className = "compare-merge-btn";
                btnRight.title = "Copy changes to Right (Alt+→)";
                btnRight.innerHTML = '<i class="fas fa-chevron-right"></i>';
                btnRight.addEventListener("click", () => {
                    mergeBlockRight(block);
                });
                btnGroup.appendChild(btnRight);
            }

            if (block.type === "added" || block.type === "modified") {
                const btnLeft = document.createElement("button");
                btnLeft.className = "compare-merge-btn";
                btnLeft.title = "Copy changes to Left (Alt+←)";
                btnLeft.innerHTML = '<i class="fas fa-chevron-left"></i>';
                btnLeft.addEventListener("click", () => {
                    mergeBlockLeft(block);
                });
                btnGroup.appendChild(btnLeft);
            }

            inner.appendChild(btnGroup);
        });

        compareMergeGutter.appendChild(inner);
    }

    function replaceTextareaLines(textarea, startLine, lineCount, replacementText) {
        const lines = textarea.value.split("\n");
        const replacementLines = replacementText.split("\n");
        if (replacementLines.length > 0 && replacementLines[replacementLines.length - 1] === "") {
            replacementLines.pop();
        }

        lines.splice(startLine, lineCount, ...replacementLines);
        textarea.value = lines.join("\n");

        textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function mergeBlockRight(block) {
        replaceTextareaLines(compareRightEditor, block.rightStartLine, block.rightCount, block.valueLeft);
        showToast?.("Merged Right", "Copied change block to Right editor", "success");
    }

    function mergeBlockLeft(block) {
        replaceTextareaLines(compareLeftEditor, block.leftStartLine, block.leftCount, block.valueRight);
        showToast?.("Merged Left", "Copied change block to Left editor", "success");
    }

    // ── Block-Based Scroll Synchronization ──────────────────────

    function mapLeftToRightLine(leftLine) {
        let currentLeft = 0;
        let currentRight = 0;

        for (const change of lastChanges) {
            if (change.type === "equal") {
                if (leftLine >= currentLeft && leftLine < currentLeft + change.count) {
                    return currentRight + (leftLine - currentLeft);
                }
                currentLeft += change.count;
                currentRight += change.count;
            } else if (change.type === "removed") {
                if (leftLine >= currentLeft && leftLine < currentLeft + change.count) {
                    return currentRight;
                }
                currentLeft += change.count;
            } else if (change.type === "added") {
                currentRight += change.count;
            }
        }
        return currentRight;
    }

    function mapRightToLeftLine(rightLine) {
        let currentLeft = 0;
        let currentRight = 0;

        for (const change of lastChanges) {
            if (change.type === "equal") {
                if (rightLine >= currentRight && rightLine < currentRight + change.count) {
                    return currentLeft + (rightLine - currentRight);
                }
                currentLeft += change.count;
                currentRight += change.count;
            } else if (change.type === "removed") {
                currentLeft += change.count;
            } else if (change.type === "added") {
                if (rightLine >= currentRight && rightLine < currentRight + change.count) {
                    return currentLeft;
                }
                currentRight += change.count;
            }
        }
        return currentLeft;
    }

    function syncScroll(source, target) {
        if (isSyncingScroll) return;
        isSyncingScroll = true;

        const leftLH = getLineHeight(compareLeftEditor);
        const rightLH = getLineHeight(compareRightEditor);

        const sourceMax = source.scrollHeight - source.clientHeight;
        const targetMax = target.scrollHeight - target.clientHeight;

        if (sourceMax <= 0 || targetMax <= 0) {
            isSyncingScroll = false;
            return;
        }

        // Snap to bottom if scrolled to end
        if (source.scrollTop >= sourceMax - 5) {
            target.scrollTop = targetMax;
            isSyncingScroll = false;
            return;
        }

        if (source === compareLeftEditor) {
            const leftLine = source.scrollTop / leftLH;
            const rightLine = mapLeftToRightLine(leftLine);
            target.scrollTop = rightLine * rightLH;
        } else {
            const rightLine = source.scrollTop / rightLH;
            const leftLine = mapRightToLeftLine(rightLine);
            target.scrollTop = leftLine * leftLH;
        }

        isSyncingScroll = false;
    }

    function syncAllViewsScroll() {
        if (leftDecorContainer) leftDecorContainer.scrollTop = compareLeftEditor.scrollTop;
        if (rightDecorContainer) rightDecorContainer.scrollTop = compareRightEditor.scrollTop;
        if (compareMergeGutter) compareMergeGutter.scrollTop = compareLeftEditor.scrollTop;
    }

    compareLeftEditor.addEventListener("scroll", () => {
        syncScroll(compareLeftEditor, compareRightEditor);
        syncAllViewsScroll();
    });

    compareRightEditor.addEventListener("scroll", () => {
        syncScroll(compareRightEditor, compareLeftEditor);
        syncAllViewsScroll();
    });

    // ── Live Editing ───────────────────────────────────────────

    compareLeftEditor.addEventListener("input", scheduleCompare);
    compareRightEditor.addEventListener("input", scheduleCompare);

    // ── Cursor tracking ────────────────────────────────────────

    function updateCursorStatus(textarea) {
        if (!statusCursor) return;
        const val = textarea.value.substring(0, textarea.selectionStart);
        const line = val.split("\n").length;
        const col = val.length - val.lastIndexOf("\n");
        statusCursor.textContent = `Ln ${line}, Col ${col}`;
    }

    compareLeftEditor.addEventListener("click", () => updateCursorStatus(compareLeftEditor));
    compareLeftEditor.addEventListener("keyup", () => updateCursorStatus(compareLeftEditor));
    compareRightEditor.addEventListener("click", () => updateCursorStatus(compareRightEditor));
    compareRightEditor.addEventListener("keyup", () => updateCursorStatus(compareRightEditor));

    // ── F7 Navigation ──────────────────────────────────────────

    function navigateChanges(dir) {
        if (activeBlocks.length === 0) {
            showToast?.("No changes", "No differences found to navigate", "info");
            return;
        }

        currentBlockIndex = (currentBlockIndex + dir + activeBlocks.length) % activeBlocks.length;
        jumpToBlock(currentBlockIndex);
    }

    function jumpToBlock(index) {
        const block = activeBlocks[index];
        if (!block) return;

        const leftLH = getLineHeight(compareLeftEditor);
        const rightLH = getLineHeight(compareRightEditor);

        // Center selected block in viewports
        const leftScrollTop = (block.leftStartLine * leftLH) - (compareLeftEditor.clientHeight / 2) + (Math.max(block.leftCount, 1) * leftLH / 2);
        const rightScrollTop = (block.rightStartLine * rightLH) - (compareRightEditor.clientHeight / 2) + (Math.max(block.rightCount, 1) * rightLH / 2);

        compareLeftEditor.scrollTop = Math.max(0, leftScrollTop);
        compareRightEditor.scrollTop = Math.max(0, rightScrollTop);

        // Place cursor at the start of block
        const leftOffset = getCharOffsetOfLine(compareLeftEditor.value, block.leftStartLine);
        compareLeftEditor.focus();
        compareLeftEditor.setSelectionRange(leftOffset, leftOffset);

        const rightOffset = getCharOffsetOfLine(compareRightEditor.value, block.rightStartLine);
        compareRightEditor.setSelectionRange(rightOffset, rightOffset);

        renderAllDecorations();
        syncAllViewsScroll();
    }

    if (prevChangeBtn) prevChangeBtn.addEventListener("click", () => navigateChanges(-1));
    if (nextChangeBtn) nextChangeBtn.addEventListener("click", () => navigateChanges(1));
    if (undoBtn) undoBtn.addEventListener("click", undo);
    if (redoBtn) redoBtn.addEventListener("click", redo);

    // Change counter clicking jumps to first match
    if (statAdded) statAdded.addEventListener("click", () => jumpToFirstChangeOfType("added"));
    if (statRemoved) statRemoved.addEventListener("click", () => jumpToFirstChangeOfType("removed"));
    if (statModified) statModified.addEventListener("click", () => jumpToFirstChangeOfType("modified"));

    function jumpToFirstChangeOfType(type) {
        const idx = activeBlocks.findIndex(b => b.type === type);
        if (idx !== -1) {
            currentBlockIndex = idx;
            jumpToBlock(idx);
        } else {
            showToast?.("No changes", `No ${type} changes found`, "info");
        }
    }

    // ── Merge Actions ──────────────────────────────────────────

    function acceptAll(direction) {
        if (direction === "right") {
            compareRightEditor.value = compareLeftEditor.value;
            compareRightEditor.dispatchEvent(new Event("input", { bubbles: true }));
            showToast?.("Accept All Right", "Copied entire Left editor to Right editor", "success");
        } else {
            compareLeftEditor.value = compareRightEditor.value;
            compareLeftEditor.dispatchEvent(new Event("input", { bubbles: true }));
            showToast?.("Accept All Left", "Copied entire Right editor to Left editor", "success");
        }
    }

    if (mergeActionSelect) {
        mergeActionSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            if (!val) return;

            if (val === "accept-all-right") {
                if (window.confirm("Copy all Left editor contents to Right editor?")) {
                    acceptAll("right");
                }
            } else if (val === "accept-all-left") {
                if (window.confirm("Copy all Right editor contents to Left editor?")) {
                    acceptAll("left");
                }
            } else if (val === "reset") {
                if (window.confirm("Discard all edits and reset compare workspace?")) {
                    compareLeftEditor.value = originalLeftContent;
                    compareRightEditor.value = originalRightContent;
                    currentBlockIndex = -1;
                    runCompare();
                    showToast?.("Reset complete", "Restored initial compare states", "info");
                }
            }

            // Reset selection
            mergeActionSelect.value = "";
        });
    }

    // ── Export Dropdown Actions ────────────────────────────────

    function copyText(text, msg) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(text)
                .then(() => showToast?.("Copied", msg, "success"))
                .catch(() => showToast?.("Copy Failed", "Unable to copy content", "error"));
        } else {
            showToast?.("Copy Failed", "Clipboard API not supported", "error");
        }
    }

    function downloadTextFile(text, defaultName) {
        try {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = defaultName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast?.("Downloaded", `${defaultName} saved successfully`, "success");
        } catch (err) {
            showToast?.("Download Failed", err.message || "Unable to download file", "error");
        }
    }

    if (exportSelect) {
        exportSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            if (!val) return;

            if (val === "copy-left") {
                copyText(compareLeftEditor.value, "Left editor content copied to clipboard");
            } else if (val === "copy-right") {
                copyText(compareRightEditor.value, "Right editor content copied to clipboard");
            } else if (val === "download-left") {
                downloadTextFile(compareLeftEditor.value, leftFileName || "left_merged.txt");
            } else if (val === "download-right") {
                downloadTextFile(compareRightEditor.value, rightFileName || "right_merged.txt");
            } else if (val === "open-left-editors") {
                if (leftEditor) {
                    leftEditor.value = compareLeftEditor.value;
                    leftEditor.dispatchEvent(new Event("input", { bubbles: true }));
                }
                document.getElementById("editors-tab-btn")?.click();
                showToast?.("Opened in Editors", "Left content copied back to Editors tab", "success");
            } else if (val === "open-right-editors") {
                if (rightEditor) {
                    rightEditor.value = compareRightEditor.value;
                    rightEditor.dispatchEvent(new Event("input", { bubbles: true }));
                }
                document.getElementById("editors-tab-btn")?.click();
                showToast?.("Opened in Editors", "Right content copied back to Editors tab", "success");
            }

            exportSelect.value = "";
        });
    }

    // ── Keyboard Shortcuts inside Compare tab ──────────────────

    document.addEventListener("keydown", (e) => {
        const compareTab = document.getElementById("compare-tab");
        if (!compareTab || !compareTab.classList.contains("active")) return;

        // Alt + Arrow keys: Merging active block
        if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
            e.preventDefault();
            if (currentBlockIndex >= 0 && currentBlockIndex < activeBlocks.length) {
                const block = activeBlocks[currentBlockIndex];
                if (e.key === "ArrowRight") {
                    if (block.type === "removed" || block.type === "modified") {
                        mergeBlockRight(block);
                    }
                } else if (e.key === "ArrowLeft") {
                    if (block.type === "added" || block.type === "modified") {
                        mergeBlockLeft(block);
                    }
                }
            }
            return;
        }

        // F7: Prev change, Shift + F7: Next change
        if (e.key === "F7") {
            e.preventDefault();
            if (e.shiftKey) {
                navigateChanges(1);
            } else {
                navigateChanges(-1);
            }
            return;
        }

        // Ctrl+Z / Ctrl+Y or Cmd+Z / Cmd+Shift+Z / Cmd+Y shortcuts
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            if (e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            } else if (e.key.toLowerCase() === "y") {
                e.preventDefault();
                redo();
                return;
            }
        }
    });

    // ── Toolbar Option Toggles ─────────────────────────────────

    if (autoCompareToggle) {
        autoCompareToggle.addEventListener("click", () => {
            autoCompare = !autoCompare;
            autoCompareToggle.classList.toggle("is-active", autoCompare);
            if (autoCompare) runCompare();
        });
    }

    if (ignoreSelect) {
        ignoreSelect.addEventListener("change", () => {
            runCompare();
        });
    }

    if (wrapToggle) {
        wrapToggle.addEventListener("click", () => {
            const wrapped = document.body.classList.toggle("wrap-lines");
            wrapToggle.classList.toggle("is-active", wrapped);
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener("click", () => {
            const temp = compareLeftEditor.value;
            compareLeftEditor.value = compareRightEditor.value;
            compareRightEditor.value = temp;

            const tempName = leftFileName;
            leftFileName = rightFileName;
            rightFileName = tempName;

            runCompare();
            showToast?.("Swapped", "Compare editors swapped", "success");
        });
    }

    // ── Search ─────────────────────────────────────────────────

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim();
            if (!query) {
                if (searchCount) searchCount.textContent = "";
                return;
            }

            const leftMatches = countOccurrences(compareLeftEditor.value, query);
            const rightMatches = countOccurrences(compareRightEditor.value, query);
            const total = leftMatches + rightMatches;

            if (searchCount) {
                searchCount.textContent = `${total}`;
            }
        });
    }

    function countOccurrences(text, query) {
        if (!query) return 0;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let count = 0;
        let idx = 0;
        while ((idx = lowerText.indexOf(lowerQuery, idx)) !== -1) {
            count++;
            idx += lowerQuery.length;
        }
        return count;
    }

    // Manual compare run button
    const manualCompareBtn = document.getElementById("compare-run-btn");
    if (manualCompareBtn) {
        manualCompareBtn.addEventListener("click", () => {
            runCompare();
            showToast?.("Compared", "Diff updated successfully", "success");
        });
    }

    // ── Public API ─────────────────────────────────────────────

    return {
        loadFromEditors,
        runCompare
    };
}
