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
        } else if (target === "diff") {
            diffTabButton.classList.add("active");
            diffSection.classList.add("active");
            diffSection.scrollTop = 0;
        }
    }

    safeBind("editors-tab-btn", () => switchTab("editors"));
    safeBind("diff-tab-btn", () => switchTab("diff"));
    safeBind("back-to-editors", () => switchTab("editors"));

    safeBind("toggle-context", () => {
        const diffOutput = document.getElementById("diff2html-output");
        const toggleBtn = document.getElementById("toggle-context");

        if (diffOutput.classList.contains("show-all")) {
            // Switch to show only differences
            diffOutput.classList.remove("show-all");
            diffOutput.classList.add("show-diff-only");
            toggleBtn.textContent = "Show All";
        } else {
            // Switch to show all lines
            diffOutput.classList.remove("show-diff-only");
            diffOutput.classList.add("show-all");
            toggleBtn.textContent = "Show Diff Only";
        }
    });

    /* ============================================================
       CODE FORMATTING
    ============================================================ */
    function formatCode(textarea) {
        const code = textarea.value.trim();
        if (!code) return;

        // Try to detect language based on content
        const language = detectLanguage(code);

        try {
            switch (language) {
                case 'json':
                    const parsed = JSON.parse(code);
                    textarea.value = JSON.stringify(parsed, null, 2);
                    showToast('JSON formatted successfully!', 'success');
                    break;

                case 'javascript':
                    textarea.value = formatJavaScript(code);
                    showToast('JavaScript formatted!', 'success');
                    break;

                case 'html':
                    textarea.value = formatHTML(code);
                    showToast('HTML formatted!', 'success');
                    break;

                case 'css':
                    textarea.value = formatCSS(code);
                    showToast('CSS formatted!', 'success');
                    break;

                default:
                    // Try generic formatting
                    textarea.value = formatGeneric(code);
                    showToast('Code formatted!', 'info');
            }
        } catch (err) {
            console.error('Formatting error:', err);
            showToast('Could not format code. Unsupported format or syntax error.', 'error');
        }
    }

    function detectLanguage(code) {
        // Check for JSON
        try {
            JSON.parse(code);
            return 'json';
        } catch (e) {
            // Not JSON, continue detection
        }

        // Check for HTML
        if (/<[a-z][\s\S]*>/i.test(code)) {
            return 'html';
        }

        // Check for CSS
        if (/\{[^{}]*\}/.test(code) && /[a-zA-Z-]+\s*:/.test(code)) {
            return 'css';
        }

        // Default to JavaScript for code with common JS patterns
        if (/(function|const|let|var|=>|import|export|class)\s+/.test(code)) {
            return 'javascript';
        }

        return 'unknown';
    }

    function formatJavaScript(code) {
        // Enhanced JavaScript formatting
        return code
            // Normalize whitespace
            .replace(/\s*([{}()[\]=,;:+\-*/%&|^~!<>?])\s*/g, ' $1 ')
            .replace(/\s+/g, ' ')
            .trim()
            // Add newlines
            .replace(/([;{}])\s*/g, '$1\n')
            .replace(/([^\{\}])\{/g, '$1 {')
            .replace(/\}\s*/g, '}\n')
            // Handle indentation
            .split('\n')
            .map((line, i, arr) => {
                line = line.trim();
                // Handle indentation
                const indent = line.match(/^(\s*)/)[0].length;
                if (line.endsWith('{') || line.endsWith('[')) {
                    return '    '.repeat(indent) + line;
                }
                if (line.endsWith('}') || line.endsWith(']')) {
                    return '    '.repeat(Math.max(0, indent - 4)) + line;
                }
                return '    '.repeat(indent) + line;
            })
            .join('\n')
            // Clean up
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function formatHTML(code) {
        // Basic HTML formatting
        let indent = 0;
        return code
            .replace(/</g, '\n<')
            .replace(/>/g, '>\n')
            .split('\n')
            .map(line => {
                line = line.trim();
                if (!line) return '';

                if (line.startsWith('</')) {
                    indent = Math.max(0, indent - 4);
                }

                const result = ' '.repeat(indent) + line;

                if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>')) {
                    indent += 4;
                }

                return result;
            })
            .filter(line => line.trim())
            .join('\n');
    }

    function formatCSS(code) {
        // Remove all existing whitespace
        let formatted = code.replace(/\s+/g, ' ').trim();

        // Add newlines and proper indentation
        let indent = 0;
        let inRule = false;
        let inMedia = false;

        return formatted
            // Handle @ rules
            .replace(/(@[^{]+\{)/g, '\n$1\n')
            // Handle closing braces
            .replace(/\}/g, '\n}\n')
            // Handle opening braces
            .replace(/\{/g, ' {\n')
            // Handle semicolons
            .replace(/;/g, ';\n')
            // Split into lines
            .split('\n')
            .map(line => {
                line = line.trim();
                if (!line) return '';

                // Decrease indent after closing brace
                if (line.endsWith('}')) {
                    indent = Math.max(0, indent - 4);
                }

                // Apply current indent
                const result = ' '.repeat(indent) + line;

                // Increase indent after opening brace
                if (line.endsWith('{')) {
                    indent += 4;
                }

                return result;
            })
            .filter(line => line.trim())
            .join('\n')
            // Clean up extra newlines
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function formatGeneric(code) {
        // Fallback formatter for unknown languages
        return code
            .replace(/\s*([{}()[\]=,;:+\-*/%&|^~!<>?])\s*/g, ' $1 ')
            .replace(/\s+/g, ' ')
            .replace(/([;{}])\s*/g, '$1\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // Add event listeners for format buttons
    const formatLeftBtn = document.getElementById('format-left');
    const formatRightBtn = document.getElementById('format-right');
    
    // Function to swap editor contents
    function swapEditorContents() {
        const leftEditor = document.getElementById('left-editor');
        const rightEditor = document.getElementById('right-editor');
        
        if (leftEditor && rightEditor) {
            const temp = leftEditor.value;
            leftEditor.value = rightEditor.value;
            rightEditor.value = temp;
            
            // Trigger input events to update any listeners
            leftEditor.dispatchEvent(new Event('input', { bubbles: true }));
            rightEditor.dispatchEvent(new Event('input', { bubbles: true }));
            
            showToast("Editors swapped", "The content has been swapped between editors", "success");
            return true;
        }
        return false;
    }

    // Add event listener for editor swap button
    safeBind("swap-btn", swapEditorContents);
    safeBind("swap-editors-btn", swapEditorContents);
    
    // Add event listener for diff view swap button
    safeBind("swap-in-diff", () => {
        if (swapEditorContents()) {
            // If swap was successful, re-run the comparison
            document.getElementById('compare-btn').click();
        }
    });

    if (formatLeftBtn && leftEditor) {
        formatLeftBtn.addEventListener('click', () => formatCode(leftEditor));
    }

    if (formatRightBtn && rightEditor) {
        formatRightBtn.addEventListener('click', () => formatCode(rightEditor));
    }

    // Add keyboard shortcut (Alt + F) for formatting
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement === leftEditor) {
                formatCode(leftEditor);
            } else if (activeElement === rightEditor) {
                formatCode(rightEditor);
            }
        }
    });

    /* ============================================================
       FOOTER INITIALIZATION
    ============================================================ */
    // Set current year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Populate footer with constants (if constants module is available)
    // Since constants is a module, we'll use static values for now
    const footerTitle = document.getElementById('footerTitle');
    const tagline = document.getElementById('tagline');
    const authorDisplay = document.getElementById('authorDisplay');
    const copyright = document.getElementById('copyright');

    if (footerTitle) footerTitle.textContent = 'DiffBoard';
    if (tagline) tagline.textContent = 'Your Ultimate Diff Tool for Code Comparison';
    if (authorDisplay) authorDisplay.textContent = 'Kartik Patkar';
    if (copyright) copyright.textContent = 'DiffBoard. All rights reserved.';

    /* ============================================================
       THEME TOGGLE
    ============================================================ */
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Load saved theme preference or default to light theme
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.className = savedTheme;
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark-theme';
    }

    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                body.className = 'dark-theme';
                localStorage.setItem('theme', 'dark-theme');
                // showToast('Dark Mode', 'Theme changed to dark mode', 'success');
            } else {
                body.className = 'light-theme';
                localStorage.setItem('theme', 'light-theme');
                // showToast('Light Mode', 'Theme changed to light mode', 'success');
            }
        });
    }

    /* ============================================================
       JSON MODE TOGGLE
    ============================================================ */
    safeBind("json-toggle", () => {
        const leftEditor = document.getElementById('left-editor');
        const rightEditor = document.getElementById('right-editor');
        const jsonBtn = document.getElementById('json-toggle');
        
        if (leftEditor && rightEditor && jsonBtn) {
            // Toggle JSON mode visual state
            if (jsonBtn.textContent === 'JSON Mode') {
                jsonBtn.textContent = 'Exit JSON';
                jsonBtn.classList.add('btn-primary');
                jsonBtn.classList.remove('btn-secondary');
                
                // Try to format both editors as JSON
                try {
                    if (leftEditor.value.trim()) {
                        const parsed = JSON.parse(leftEditor.value);
                        leftEditor.value = JSON.stringify(parsed, null, 2);
                    }
                    if (rightEditor.value.trim()) {
                        const parsed = JSON.parse(rightEditor.value);
                        rightEditor.value = JSON.stringify(parsed, null, 2);
                    }
                    showToast('JSON Mode', 'Editors formatted as JSON', 'success');
                } catch (err) {
                    showToast('JSON Error', 'Invalid JSON format', 'error');
                }
            } else {
                jsonBtn.textContent = 'JSON Mode';
                jsonBtn.classList.remove('btn-primary');
                jsonBtn.classList.add('btn-secondary');
                showToast('JSON Mode', 'Exited JSON mode', 'info');
            }
        }
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

    function markDiffRows() {
        // Mark table rows that contain added or removed lines
        const rows = diffOutput.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const hasIns = row.querySelector('.d2h-ins');
            const hasDel = row.querySelector('.d2h-del');
            if (hasIns || hasDel) {
                row.classList.add('has-diff');
            }
        });
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

        // Mark rows that contain differences
        markDiffRows();

        // Set default view to show all lines
        diffOutput.classList.remove("show-diff-only");
        diffOutput.classList.add("show-all");

        // Update toggle button text
        const toggleBtn = document.getElementById("toggle-context");
        if (toggleBtn) {
            toggleBtn.textContent = "Show Diff Only";
        }

        // Setup collapse (but DO NOT auto-collapse anything)
        addCollapseControls();

        // Enable diff tab and switch
        document.getElementById("diff-tab-btn").disabled = false;
        switchTab("diff");

        showToast("Comparison Complete", "Diff generated successfully", "success");
    });
});