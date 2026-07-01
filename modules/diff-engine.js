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

function normalizeForCompare(value, options) {
    if (!options.ignoreLineEndings) return value;
    return value.replace(/\r\n?/g, "\n");
}

function createUnifiedDiff(oldStr, newStr, options) {
    if (!window.Diff) {
        return { text: "", stats: { added: 0, removed: 0, modified: 0 } };
    }

    const normalizedOld = normalizeForCompare(oldStr, options);
    const normalizedNew = normalizeForCompare(newStr, options);

    const patch = window.Diff.structuredPatch(
        "Original",
        "Modified",
        normalizedOld,
        normalizedNew,
        "",
        "",
        {
            context: Number.MAX_SAFE_INTEGER,
            ignoreWhitespace: options.ignoreWhitespace,
            ignoreCase: options.ignoreCase
        }
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

function showEmptyState(diffOutput) {
    if (!diffOutput) return;
    diffOutput.innerHTML = `
        <div class="diff-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5c0-1.1-.9-2-2-2z"/>
                <path d="M22 7h-2M22 12h-2M22 17h-2M8 8h4M8 12h4M8 16h4"/>
            </svg>
            <h3>No comparison results yet</h3>
            <p>Paste or import code in the Editors tab, then click Compare to see differences.</p>
        </div>
    `;
}

function waitForNextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
}

function clearDiffSearchHighlights(diffOutput) {
    diffOutput.querySelectorAll("mark.diff-search-hit").forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
    });
}

function highlightMatchesInTextNode(textNode, query) {
    const text = textNode.textContent || "";
    const source = text.toLowerCase();
    const target = query.toLowerCase();
    let startIndex = 0;
    let matchIndex = source.indexOf(target, startIndex);

    if (matchIndex === -1) return 0;

    const fragment = document.createDocumentFragment();
    let count = 0;

    while (matchIndex !== -1) {
        if (matchIndex > startIndex) {
            fragment.appendChild(document.createTextNode(text.slice(startIndex, matchIndex)));
        }

        const mark = document.createElement("mark");
        mark.className = "diff-search-hit";
        mark.textContent = text.slice(matchIndex, matchIndex + target.length);
        fragment.appendChild(mark);
        count += 1;

        startIndex = matchIndex + target.length;
        matchIndex = source.indexOf(target, startIndex);
    }

    if (startIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(startIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
    return count;
}

async function buildHtmlDownloadDocument(renderedHtml) {
    let diff2HtmlCss = "";

    try {
        const response = await fetch(chrome.runtime.getURL("libs/diff2html/diff2html.min.css"));
        diff2HtmlCss = await response.text();
    } catch {
        diff2HtmlCss = "";
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DiffBoard Export</title>
    <style>
        body { margin: 0; padding: 24px; font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
        .export-shell { max-width: 1400px; margin: 0 auto; }
        .export-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .export-subtitle { font-size: 14px; color: #475569; margin-bottom: 18px; }
        ${diff2HtmlCss}
    </style>
</head>
<body>
    <div class="export-shell">
        <div class="export-title">DiffBoard Export</div>
        <div class="export-subtitle">Generated ${new Date().toISOString()}</div>
        ${renderedHtml}
    </div>
</body>
</html>`;
}

const COMPARE_DEBOUNCE_MS = 180;

export function initDiffEngine({ leftEditor, rightEditor, diffOutput, safeBind, showToast }) {
    const editorsSection = document.getElementById("editors-tab");
    const diffSection = document.getElementById("diff-tab");
    const editorsTabButton = document.querySelector('[data-tab="editors-tab"]');
    const diffTabButton = document.querySelector('[data-tab="diff-tab"]');
    const compareButton = document.getElementById("compare-btn");
    const compareLoading = document.getElementById("compare-loading");
    const diffSearchInput = document.getElementById("diff-search");
    const diffSearchCount = document.getElementById("diff-search-count");
    const downloadFormatSelect = document.getElementById("download-format");
    const tabs = document.querySelectorAll(".tab-btn");
    let compareDebounceTimer = null;
    let compareInFlight = false;
    let lastRenderedPatch = "";
    let lastRenderedHtml = "";
    let searchHits = [];
    let searchHitIndex = -1;
    let isDirty = false;

    leftEditor?.addEventListener("input", () => { isDirty = true; });
    rightEditor?.addEventListener("input", () => { isDirty = true; });

    showEmptyState(diffOutput);

    function getCompareOptions() {
        return {
            ignoreWhitespace: document.getElementById("ignore-whitespace")?.checked ?? false,
            ignoreCase: document.getElementById("ignore-case")?.checked ?? false,
            ignoreLineEndings: document.getElementById("ignore-line-endings")?.checked ?? false
        };
    }

    function updateDiffSearchCount(count, query) {
        if (!diffSearchCount) return;

        diffSearchCount.textContent = query
            ? `${count} match${count === 1 ? "" : "es"}`
            : "";
    }

    function updateSearchSelection(newIndex) {
        if (searchHits.length === 0) return;

        if (searchHitIndex >= 0 && searchHitIndex < searchHits.length) {
            searchHits[searchHitIndex].classList.remove("active-hit");
        }

        searchHitIndex = (newIndex + searchHits.length) % searchHits.length;
        const currentHit = searchHits[searchHitIndex];
        currentHit.classList.add("active-hit");
        currentHit.scrollIntoView({ block: "center", behavior: "smooth" });

        if (diffSearchCount) {
            diffSearchCount.textContent = `${searchHitIndex + 1} of ${searchHits.length}`;
        }
    }

    function applyDiffSearch() {
        const query = diffSearchInput?.value.trim() || "";
        clearDiffSearchHighlights(diffOutput);

        if (!query) {
            searchHits = [];
            searchHitIndex = -1;
            updateDiffSearchCount(0, "");
            return;
        }

        let totalMatches = 0;
        const containers = diffOutput.querySelectorAll(".d2h-code-line-ctn, .d2h-code-side-line-ctn");

        containers.forEach((container) => {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    return node.textContent?.trim()
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            });

            const textNodes = [];
            let currentNode = walker.nextNode();
            while (currentNode) {
                textNodes.push(currentNode);
                currentNode = walker.nextNode();
            }

            textNodes.forEach((textNode) => {
                totalMatches += highlightMatchesInTextNode(textNode, query);
            });
        });

        searchHits = Array.from(diffOutput.querySelectorAll("mark.diff-search-hit"));
        searchHitIndex = -1;

        if (searchHits.length > 0) {
            updateSearchSelection(0);
        } else {
            updateDiffSearchCount(0, query);
        }
    }

    async function downloadDiff() {
        if (!lastRenderedPatch) {
            showToast?.("Nothing to Download", "Generate a diff before downloading it", "error");
            return;
        }

        const format = downloadFormatSelect?.value || "txt";
        const now = new Date();
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
        const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, "");
        const timestamp = `${yyyymmdd}_${hhmmss}`;

        let fileName = `diff_${timestamp}.txt`;
        let type = "text/plain;charset=utf-8";
        let content = lastRenderedPatch;

        if (format === "html") {
            fileName = `diff_${timestamp}.html`;
            type = "text/html;charset=utf-8";
            content = await buildHtmlDownloadDocument(lastRenderedHtml || diffOutput.innerHTML);
        }

        const blob = new Blob([content], { type });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);

        showToast?.("Download Ready", `${fileName} downloaded`, "success");
    }

    function switchTab(target) {
        const compareSection = document.getElementById("compare-tab");
        const compareTabButton = document.querySelector('[data-tab="compare-tab"]');

        tabs.forEach((t) => t.classList.remove("active"));
        editorsSection?.classList.remove("active");
        diffSection?.classList.remove("active");
        compareSection?.classList.remove("active");

        if (target === "editors") {
            editorsTabButton?.classList.add("active");
            editorsSection?.classList.add("active");
        } else if (target === "diff") {
            diffTabButton?.classList.add("active");
            diffSection?.classList.add("active");
            if (diffSection) diffSection.scrollTop = 0;
        } else if (target === "compare") {
            compareTabButton?.classList.add("active");
            compareSection?.classList.add("active");
        }

        try {
            localStorage.setItem("active-tab", target);
        } catch {
            // Ignore storage errors and keep the UI functional.
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

    function setCompareLoading(isLoading) {
        diffOutput.classList.toggle("is-loading", isLoading);

        if (compareLoading) {
            compareLoading.hidden = !isLoading;
            compareLoading.setAttribute("aria-hidden", String(!isLoading));
        }

        if (compareButton) {
            compareButton.disabled = isLoading;
            compareButton.setAttribute("aria-busy", String(isLoading));
            compareButton.innerHTML = isLoading
                ? "<span>Comparing...</span>"
                : `
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <use href="../assets/icons/sprite.svg#icon-compare"></use>
                    </svg>
                    Compare
                `;
        }
    }

    async function runComparison() {
        if (compareInFlight) return;

        const leftText = leftEditor.value;
        const rightText = rightEditor.value;

        if (!leftText && !rightText) {
            showToast?.("Nothing to Compare", "Both editors are empty", "error");
            return;
        }

        compareInFlight = true;
        switchTab("diff");
        setCompareLoading(true);
        await waitForNextPaint();

        try {
            const compareOptions = getCompareOptions();
            const { text: patch, stats } = createUnifiedDiff(leftText, rightText, compareOptions);

            const layoutSelect = document.getElementById("diff-layout-select");
            const formatLayout = layoutSelect?.value || "side-by-side";

            const html = window.Diff2Html.html(patch, {
                drawFileList: false,
                matching: "lines",
                outputFormat: formatLayout,
                diffStyle: "word",
                highlight: true,
                context: Number.MAX_SAFE_INTEGER
            });

            lastRenderedPatch = patch;
            lastRenderedHtml = html;
            diffOutput.innerHTML = html;
            diffOutput.lastPatch = patch; // save for copy patch action
            isDirty = false; // reset dirty state

            updateSummary(stats);
            markDiffRows(diffOutput);
            applyDiffSearch();

            diffOutput.classList.remove("show-diff-only");
            diffOutput.classList.add("show-all");

            const toggleBtn = document.getElementById("toggle-context");
            setToggleContextLabel(toggleBtn, "Show Diff Only");

            addCollapseControls();

            if (diffTabButton) {
                diffTabButton.disabled = false;
            }

            showToast?.("Comparison Complete", "Diff generated successfully", "success");
        } catch (error) {
            lastRenderedPatch = "";
            lastRenderedHtml = "";
            diffOutput.innerHTML = "";
            diffOutput.lastPatch = "";
            showToast?.("Comparison Failed", error?.message || "Unable to render diff", "error");
        } finally {
            compareInFlight = false;
            setCompareLoading(false);
        }
    }

    function compareNow() {
        if (compareInFlight) return;

        if (compareDebounceTimer) {
            clearTimeout(compareDebounceTimer);
        }

        compareDebounceTimer = setTimeout(() => {
            compareDebounceTimer = null;
            runComparison();
        }, COMPARE_DEBOUNCE_MS);
    }

    safeBind("editors-tab-btn", () => switchTab("editors"));
    safeBind("diff-tab-btn", () => {
        if (isDirty) {
            compareNow();
        } else {
            switchTab("diff");
        }
    });
    safeBind("back-to-editors", () => switchTab("editors"));
    safeBind("compare-tab-btn", () => switchTab("compare"));
    safeBind("toggle-context", toggleContextMode);
    safeBind("compare-btn", compareNow);
    safeBind("download-diff", () => {
        downloadDiff().catch((error) => {
            showToast?.("Download Failed", error?.message || "Unable to download diff", "error");
        });
    });
    safeBind("diff-layout-select", () => {
        compareNow();
    }, "change");
    safeBind("search-prev", () => {
        if (searchHits.length > 0) updateSearchSelection(searchHitIndex - 1);
    });
    safeBind("search-next", () => {
        if (searchHits.length > 0) updateSearchSelection(searchHitIndex + 1);
    });
    diffSearchInput?.addEventListener("input", applyDiffSearch);
    diffSearchInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (searchHits.length > 0) {
                if (e.shiftKey) {
                    updateSearchSelection(searchHitIndex - 1);
                } else {
                    updateSearchSelection(searchHitIndex + 1);
                }
            }
        }
    });

    function clearDiff() {
        lastRenderedPatch = "";
        lastRenderedHtml = "";
        if (diffOutput) {
            showEmptyState(diffOutput);
            diffOutput.lastPatch = "";
        }
        updateSummary({ added: 0, removed: 0, modified: 0 });
    }

    return { switchTab, compareNow, clearDiff };
}
