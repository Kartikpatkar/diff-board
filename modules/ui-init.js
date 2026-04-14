export function initUi({ showToast }) {
    const currentYearEl = document.getElementById("currentYear");
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    const footerTitle = document.getElementById("footerTitle");
    const tagline = document.getElementById("tagline");
    const authorDisplay = document.getElementById("authorDisplay");
    const copyright = document.getElementById("copyright");

    if (footerTitle) footerTitle.textContent = "DiffBoard";
    if (tagline) tagline.textContent = "Your Ultimate Diff Tool for Code Comparison";
    if (authorDisplay) authorDisplay.textContent = "Kartik Patkar";
    if (copyright) copyright.textContent = "DiffBoard. All rights reserved.";

    const themeToggle = document.getElementById("theme-toggle");
    const shortcutsButton = document.getElementById("shortcuts-btn");
    const shortcutsModal = document.getElementById("shortcuts-modal");
    const shortcutsBackdrop = document.getElementById("shortcuts-backdrop");
    const shortcutsClose = document.getElementById("shortcuts-close");
    const body = document.body;

    function setTheme(theme) {
        body.classList.remove("light-theme", "dark-theme");
        body.classList.add(theme);
        localStorage.setItem("theme", theme);

        if (themeToggle) {
            themeToggle.checked = theme === "dark-theme";
        }
    }

    function toggleTheme() {
        const nextTheme = body.classList.contains("dark-theme") ? "light-theme" : "dark-theme";
        setTheme(nextTheme);
        showToast?.("Theme Updated", `Switched to ${nextTheme === "dark-theme" ? "dark" : "light"} mode`, "info");
    }

    function setShortcutsModalOpen(isOpen) {
        if (!shortcutsModal || !shortcutsBackdrop) return;

        shortcutsModal.hidden = !isOpen;
        shortcutsBackdrop.hidden = !isOpen;
        shortcutsButton?.setAttribute("aria-expanded", String(isOpen));

        if (isOpen) {
            shortcutsClose?.focus();
            return;
        }

        shortcutsButton?.focus();
    }

    const savedTheme = localStorage.getItem("theme") || "light-theme";
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            setTheme(themeToggle.checked ? "dark-theme" : "light-theme");
        });
    }

    shortcutsButton?.addEventListener("click", () => {
        setShortcutsModalOpen(shortcutsModal?.hidden !== false);
    });

    shortcutsClose?.addEventListener("click", () => {
        setShortcutsModalOpen(false);
    });

    shortcutsBackdrop?.addEventListener("click", () => {
        setShortcutsModalOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && shortcutsModal?.hidden === false) {
            setShortcutsModalOpen(false);
        }
    });

    return {
        toggleTheme,
        openShortcutsModal: () => setShortcutsModalOpen(true),
        closeShortcutsModal: () => setShortcutsModalOpen(false)
    };
}
