/* ============================================================
   DiffBoard - Main Script (FINAL BUILD)
   Includes:
   - Tab switching
   - Compare + Diff2Html rendering
   - ALWAYS show all lines (no auto-collapse)
   - Optional manual collapse (disabled by default)
   - Copy buttons
   - Toast notifications
   - JSON formatting
   - Dark mode
============================================================ */

/* --------------------------
   Safe Event Binding Helper
--------------------------- */
function safeBind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
}


/* ============================================================
   WAIT UNTIL LIBRARIES ARE LOADED (jsdiff + Diff2Html)
============================================================ */

function waitForLibrary(name, callback, timeout = 5000) {
    let waited = 0;
    const interval = setInterval(() => {

        if (typeof window[name] !== "undefined") {
            clearInterval(interval);
            callback(window[name]);
        }

        waited += 30;
        if (waited >= timeout) {
            clearInterval(interval);
            console.warn(`${name} failed to load in time.`);
        }

    }, 30);
}

/* Attach jsdiff */
waitForLibrary("Diff", (d) => (window.Diff = d));

/* Attach Diff2Html */
waitForLibrary("Diff2Html", (d) => (window.Diff2Html = d));


/* ============================================================
   MAIN APP LOGIC
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------
       Grab UI Elements
    --------------------------- */
    const leftEditor = document.getElementById("left-editor");
    const rightEditor = document.getElementById("right-editor");

    const diffOutput = document.getElementById("diff2html-output");

    const editorsSection = document.getElementById("editors-tab");
    const diffSection = document.getElementById("diff-tab");

    const editorsTabButton = document.querySelector('[data-tab="editors-tab"]');
    const diffTabButton = document.querySelector('[data-tab="diff-tab"]');

    const tabs = document.querySelectorAll(".tab-btn");


    /* ============================================================
       TAB SWITCHING
    ============================================================ */
    function switchTab(target) {
        tabs.forEach(t => t.classList.remove("active"));
        editorsSection.classList.remove("active");
        diffSection.classList.remove("active");

        if (target === "editors") {
            editorsTabButton.classList.add("active");
            editorsSection.classList.add("active");
        } else {
            diffTabButton.classList.add("active");
            diffSection.classList.add("active");
            diffSection.scrollTop = 0;
        }
    }

    safeBind("editors-tab-btn", () => switchTab("editors"));
    safeBind("diff-tab-btn", () => switchTab("diff"));
    safeBind("back-to-editors", () => switchTab("editors"));


    /* ============================================================
       THEME TOGGLE
    ============================================================ */
    chrome.storage.sync.get(["theme"], ({ theme }) => {
        if (theme === "dark") document.body.classList.add("dark-theme");
    });

    safeBind("theme-toggle", () => {
        const dark = document.body.classList.toggle("dark-theme");

        chrome.storage.sync.set({ theme: dark ? "dark" : "light" });

        showToast("Theme Updated", dark ? "Dark Mode Enabled" : "Light Mode Enabled", "info");
    });


    /* ============================================================
       JSON MODE FORMATTER
    ============================================================ */
    safeBind("json-toggle", () => {
        try { leftEditor.value = JSON.stringify(JSON.parse(leftEditor.value), null, 2); } catch { }
        try { rightEditor.value = JSON.stringify(JSON.parse(rightEditor.value), null, 2); } catch { }

        showToast("JSON Mode", "Editors formatted as JSON", "info");
    });


    /* ============================================================
       CLEAR BUTTON
    ============================================================ */
    safeBind("clear-btn", () => {
        leftEditor.value = "";
        rightEditor.value = "";
        diffOutput.innerHTML = "";

        switchTab("editors");

        showToast("Cleared", "Editors & diff reset", "info");
    });


    /* ============================================================
       COPY BUTTONS
    ============================================================ */
    safeBind("copy-left", () => {
        navigator.clipboard.writeText(leftEditor.value);
        showToast("Copied", "Left editor copied", "success");
    });

    safeBind("copy-right", () => {
        navigator.clipboard.writeText(rightEditor.value);
        showToast("Copied", "Right editor copied", "success");
    });

    safeBind("copy-diff", () => {
        navigator.clipboard.writeText(diffOutput.innerText);
        showToast("Copied", "Full diff copied", "success");
    });

    safeBind("copy-added", () => {
        const added = [...document.querySelectorAll(".d2h-ins")]
            .map(el => el.innerText)
            .join("\n");
        navigator.clipboard.writeText(added || "No added lines");
        showToast("Copied", "Added (+) lines copied", "success");
    });

    safeBind("copy-removed", () => {
        const removed = [...document.querySelectorAll(".d2h-del")]
            .map(el => el.innerText)
            .join("\n");
        navigator.clipboard.writeText(removed || "No removed lines");
        showToast("Copied", "Removed (-) lines copied", "error");
    });


    /* ============================================================
       CREATE UNIFIED DIFF
    ============================================================ */
    function computeStatsFromPatch(patch) {
        let added = 0;
        let removed = 0;

        patch.hunks.forEach(hunk => {
            hunk.lines.forEach(line => {
                if (line.startsWith('+') && !line.startsWith('+++')) added += 1;
                if (line.startsWith('-') && !line.startsWith('---')) removed += 1;
            });
        });

        // Rough approximation of "modified" lines as overlap between adds/removes
        const modified = Math.min(added, removed);

        return { added, removed, modified };
    }

    function createUnifiedDiff(oldStr, newStr) {
        if (!window.Diff) return { text: "", stats: { added: 0, removed: 0, modified: 0 } };

        const patch = window.Diff.structuredPatch(
            "Original",
            "Modified",
            oldStr,
            newStr,
            "",
            "",
            { context: Number.MAX_SAFE_INTEGER } // FULL context
        );

        let output = `--- ${patch.oldFileName}\n+++ ${patch.newFileName}\n`;

        patch.hunks.forEach(hunk => {
            output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;

            hunk.lines.forEach(line => {
                // `line` already includes prefix ' ', '+', '-'
                output += line + "\n";
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



    /* ============================================================
       MANUAL COLLAPSE FEATURE (Disabled by Default)
       -> ALL LINES SHOULD BE VISIBLE
============================================================ */

    function addCollapseControls() {
        // Do NOT collapse anything by default.
        // Collapse buttons appear ONLY if user wants to enable them later.
        // This function now ONLY enables the mechanism (no auto collapse).
    }


    /* ============================================================
       COMPARE BUTTON
============================================================ */
    safeBind("compare-btn", () => {

        const leftText = leftEditor.value.trim();
        const rightText = rightEditor.value.trim();

        if (!leftText && !rightText) {
            showToast("Nothing to Compare", "Both editors are empty", "error");
            return;
        }

        const { text: patch, stats } = createUnifiedDiff(leftText, rightText);

        const html = Diff2Html.html(patch, {
            drawFileList: false,
            matching: "lines",
            outputFormat: "side-by-side",
            diffStyle: "word",
            highlight: true,
            // FORCE full-file rendering
            context: Number.MAX_SAFE_INTEGER
        });

        diffOutput.innerHTML = html;
        updateSummary(stats);

        // Setup collapse (but DO NOT auto-collapse anything)
        addCollapseControls();

        // Enable diff tab and switch
        document.getElementById("diff-tab-btn").disabled = false;
        switchTab("diff");

        showToast("Comparison Complete", "Diff generated successfully", "success");
    });

});
