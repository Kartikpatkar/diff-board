function setToggleContextLabel(toggleBtn, label) {
    const labelEl = toggleBtn?.querySelector("span");
    if (labelEl) {
        labelEl.textContent = label;
    } else if (toggleBtn) {
        toggleBtn.textContent = label;
    }
}

function computeStatsFromPatch(patch) {
    let added = 0;
    let removed = 0;

    patch.hunks.forEach((hunk) => {
        hunk.lines.forEach((line) => {
            if (line.startsWith("+") && !line.startsWith("+++")) added += 1;
            if (line.startsWith("-") && !line.startsWith("---")) removed += 1;
        });
    });

    const modified = Math.min(added, removed);
    return { added, removed, modified };
}

function createUnifiedDiff(oldStr, newStr) {
    if (!window.Diff) {
        return { text: "", stats: { added: 0, removed: 0, modified: 0 } };
    }

    const patch = window.Diff.structuredPatch(
        "Original",
        "Modified",
        oldStr,
        newStr,
        "",
        "",
        { context: Number.MAX_SAFE_INTEGER }
    );

    let output = `--- ${patch.oldFileName}\n+++ ${patch.newFileName}\n`;

    patch.hunks.forEach((hunk) => {
        output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
        hunk.lines.forEach((line) => {
            output += `${line}\n`;
        });
    });

    return { text: output, stats: computeStatsFromPatch(patch) };
}

function updateSummary(stats) {
    const addedEl = document.getElementById("added-count");
    const removedEl = document.getElementById("removed-count");
    const modifiedEl = document.getElementById("modified-count");

    if (addedEl) addedEl.textContent = stats.added ?? 0;
    if (removedEl) removedEl.textContent = stats.removed ?? 0;
    if (modifiedEl) modifiedEl.textContent = stats.modified ?? 0;
}

function markDiffRows(diffOutput) {
    const rows = diffOutput.querySelectorAll("tbody tr");
    rows.forEach((row) => {
        const hasIns = row.querySelector(".d2h-ins");
        const hasDel = row.querySelector(".d2h-del");
        if (hasIns || hasDel) {
            row.classList.add("has-diff");
        }
    });
}

function addCollapseControls() {
    // Intentionally left as placeholder.
}

export function initDiffEngine({ leftEditor, rightEditor, diffOutput, safeBind, showToast }) {
    const editorsSection = document.getElementById("editors-tab");
    const diffSection = document.getElementById("diff-tab");
    const editorsTabButton = document.querySelector('[data-tab="editors-tab"]');
    const diffTabButton = document.querySelector('[data-tab="diff-tab"]');
    const tabs = document.querySelectorAll(".tab-btn");

    function switchTab(target) {
        tabs.forEach((t) => t.classList.remove("active"));
        editorsSection?.classList.remove("active");
        diffSection?.classList.remove("active");

        if (target === "editors") {
            editorsTabButton?.classList.add("active");
            editorsSection?.classList.add("active");
        } else if (target === "diff") {
            diffTabButton?.classList.add("active");
            diffSection?.classList.add("active");
            if (diffSection) diffSection.scrollTop = 0;
        }
    }

    function toggleContextMode() {
        const toggleBtn = document.getElementById("toggle-context");

        if (diffOutput.classList.contains("show-all")) {
            diffOutput.classList.remove("show-all");
            diffOutput.classList.add("show-diff-only");
            setToggleContextLabel(toggleBtn, "Show All");
        } else {
            diffOutput.classList.remove("show-diff-only");
            diffOutput.classList.add("show-all");
            setToggleContextLabel(toggleBtn, "Show Diff Only");
        }
    }

    function compareNow() {
        const leftText = leftEditor.value.trim();
        const rightText = rightEditor.value.trim();

        if (!leftText && !rightText) {
            showToast?.("Nothing to Compare", "Both editors are empty", "error");
            return;
        }

        const { text: patch, stats } = createUnifiedDiff(leftText, rightText);

        const html = window.Diff2Html.html(patch, {
            drawFileList: false,
            matching: "lines",
            outputFormat: "side-by-side",
            diffStyle: "word",
            highlight: true,
            context: Number.MAX_SAFE_INTEGER
        });

        diffOutput.innerHTML = html;
        updateSummary(stats);
        markDiffRows(diffOutput);

        diffOutput.classList.remove("show-diff-only");
        diffOutput.classList.add("show-all");

        const toggleBtn = document.getElementById("toggle-context");
        setToggleContextLabel(toggleBtn, "Show Diff Only");

        addCollapseControls();

        if (diffTabButton) {
            diffTabButton.disabled = false;
        }

        switchTab("diff");
        showToast?.("Comparison Complete", "Diff generated successfully", "success");
    }

    safeBind("editors-tab-btn", () => switchTab("editors"));
    safeBind("diff-tab-btn", () => switchTab("diff"));
    safeBind("back-to-editors", () => switchTab("editors"));
    safeBind("toggle-context", toggleContextMode);
    safeBind("compare-btn", compareNow);

    return { switchTab, compareNow };
}
