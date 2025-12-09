/* ============================================================
   DiffBoard – Full Tab UI + Full File Diff Mode (No Collapsing)
   - CSP safe (no inline JS)
   - Works with jsdiff + Diff2Html
   - Shows FULL file (no @@ collapsed blocks)
   - Tabs: Editors / Diff
============================================================ */

/* ------------------------------------------------------------
   WAIT FOR EXTERNAL LIBRARIES (CSP SAFE)
------------------------------------------------------------ */
function waitForLibrary(name, callback) {
    let tries = 0;
    const timer = setInterval(() => {
        const ref = window[name] || self[name];
        if (ref) {
            window[name] = ref;
            clearInterval(timer);
            callback(ref);
        }
        tries++;
        if (tries > 500) {
            console.warn(`${name} failed to load after timeout.`);
            clearInterval(timer);
        }
    }, 20);
}

waitForLibrary("Diff", d => window.Diff = d);
waitForLibrary("Diff2Html", d => window.Diff2Html = d);


/* ============================================================
   MAIN APP LOGIC
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------
       TAB SYSTEM
    ----------------------------- */
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabViews = document.querySelectorAll(".tab-content");

    function switchTab(id) {
        tabBtns.forEach(b => b.classList.remove("active"));
        tabViews.forEach(v => v.classList.remove("active"));

        document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add("active");
        document.getElementById(id).classList.add("active");
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    const diffTabBtn = document.getElementById("diff-tab-btn");


    /* -----------------------------
       DOM ELEMENTS
    ----------------------------- */
    const leftEditor = document.getElementById("left-editor");
    const rightEditor = document.getElementById("right-editor");

    const diffWrapper = document.getElementById("diff-tab");
    const diffOutput = document.getElementById("diff2html-output");

    const addedCount = document.getElementById("added-count");
    const removedCount = document.getElementById("removed-count");
    const modifiedCount = document.getElementById("modified-count");


    /* -----------------------------
       THEME
    ----------------------------- */
    chrome.storage.sync.get(["theme"], ({ theme }) => {
        if (theme === "dark") document.body.classList.add("dark-theme");
    });

    document.getElementById("theme-toggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        chrome.storage.sync.set({
            theme: document.body.classList.contains("dark-theme") ? "dark" : "light"
        });
    });


    /* -----------------------------
       CLEAR BUTTON
    ----------------------------- */
    document.getElementById("clear-btn").addEventListener("click", () => {
        leftEditor.value = "";
        rightEditor.value = "";
        diffOutput.innerHTML = "";

        addedCount.textContent = 0;
        removedCount.textContent = 0;
        modifiedCount.textContent = 0;

        diffTabBtn.disabled = true;
        switchTab("editors-tab");
    });


    /* ============================================================
       CREATE FULL CONTEXT UNIFIED DIFF (NO COLLAPSING)
    ============================================================ */
    function createUnifiedDiff(oldStr, newStr) {
        if (!window.Diff) return "";

        return window.Diff.createTwoFilesPatch(
            "Original",
            "Modified",
            oldStr,
            newStr,
            "",
            "",
            {
                context: Number.MAX_SAFE_INTEGER   // FULL FILE, NO COLLAPSE
            }
        );
    }


    /* ============================================================
       EXACT DIFF STATS
    ============================================================ */
    function calculateStats(oldStr, newStr) {
        if (!window.Diff) return { added: 0, removed: 0, modified: 0 };

        const diff = window.Diff.diffLines(oldStr, newStr);

        let added = 0, removed = 0, modified = 0;

        diff.forEach(part => {
            const lines = part.value.split("\n").filter(Boolean);

            if (part.added) added += lines.length;
            if (part.removed) removed += lines.length;
            if (part.added && part.removed) modified += lines.length;
        });

        return { added, removed, modified };
    }


    /* ============================================================
       RENDER FULL DIFF (SIDE-BY-SIDE)
    ============================================================ */
    function renderDiff(oldText, newText) {

        const unified = createUnifiedDiff(oldText, newText);

        if (!window.Diff2Html) {
            diffOutput.innerHTML = "<div class='empty-state'>Loading diff engine...</div>";
            return;
        }

        const html = window.Diff2Html.html(unified, {
            drawFileList: false,
            outputFormat: "side-by-side",
            matching: "lines",
            diffStyle: "word",
            highlight: true,

            // FORCE full-file rendering
            context: Number.MAX_SAFE_INTEGER
        });

        diffOutput.innerHTML = html;
    }


    /* ============================================================
       COMPARE BUTTON
    ============================================================ */
    document.getElementById("compare-btn").addEventListener("click", () => {

        const left = leftEditor.value.trim();
        const right = rightEditor.value.trim();

        if (!left && !right) return;

        // Generate diff
        renderDiff(left, right);

        // Enable diff tab
        diffTabBtn.disabled = false;

        // Update stats
        const stats = calculateStats(left, right);
        addedCount.textContent = stats.added;
        removedCount.textContent = stats.removed;
        modifiedCount.textContent = stats.modified;

        // Switch to diff tab
        switchTab("diff-tab");

        // Scroll diff to top
        diffWrapper.scrollTop = 0;
    });


    /* ============================================================
       BACK BUTTON
    ============================================================ */
    document.getElementById("back-to-editors").addEventListener("click", () => {
        switchTab("editors-tab");
    });


    /* ============================================================
       JSON FORMAT BUTTON
    ============================================================ */
    document.getElementById("json-toggle").addEventListener("click", () => {
        try { leftEditor.value = JSON.stringify(JSON.parse(leftEditor.value), null, 2); } catch {}
        try { rightEditor.value = JSON.stringify(JSON.parse(rightEditor.value), null, 2); } catch {}
    });

});
