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
    const wrapToggle = document.getElementById("wrap-toggle");
    const diffWrapToggle = document.getElementById("wrap-toggle-diff");
    const shortcutsButton = document.getElementById("shortcuts-btn");
    const shortcutsModal = document.getElementById("shortcuts-modal");
    const shortcutsBackdrop = document.getElementById("shortcuts-backdrop");
    const shortcutsClose = document.getElementById("shortcuts-close");
    const body = document.body;

    function setTheme(theme) {
        body.classList.remove("light-theme", "dark-theme");
        body.classList.add(theme);
        localStorage.setItem("theme", theme);

        const hljsLink = document.getElementById("highlight-theme");
        if (hljsLink) {
            hljsLink.href = theme === "dark-theme"
                ? "../libs/highlight/github-dark.min.css"
                : "../libs/highlight/github.min.css";
        }

        if (themeToggle) {
            themeToggle.checked = theme === "dark-theme";
        }
    }

    function toggleTheme() {
        const nextTheme = body.classList.contains("dark-theme") ? "light-theme" : "dark-theme";
        setTheme(nextTheme);
        showToast?.("Theme Updated", `Switched to ${nextTheme === "dark-theme" ? "dark" : "light"} mode`, "info");
    }

    function setWrapEnabled(isWrapped) {
        body.classList.toggle("wrap-lines", isWrapped);
        localStorage.setItem("wrap-lines", String(isWrapped));

        [wrapToggle, diffWrapToggle].forEach((button) => {
            button?.setAttribute("aria-pressed", String(isWrapped));
            button?.classList.toggle("is-active", isWrapped);
        });
    }

    function toggleWrap() {
        const nextValue = !body.classList.contains("wrap-lines");
        setWrapEnabled(nextValue);
        showToast?.("Wrap Updated", nextValue ? "Long lines now wrap" : "Long lines stay on one line", "info");
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

    const handleModalFocusTrap = (event) => {
        if (!shortcutsModal || shortcutsModal.hidden) return;
        if (event.key !== "Tab") return;

        const focusables = Array.from(shortcutsModal.querySelectorAll("button, [tabindex='0']"));
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                event.preventDefault();
            }
        }
    };
    document.addEventListener("keydown", handleModalFocusTrap);

    const savedTheme = localStorage.getItem("theme") || "light-theme";
    const savedWrapPreference = localStorage.getItem("wrap-lines") === "true";
    setTheme(savedTheme);
    setWrapEnabled(savedWrapPreference);

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            setTheme(themeToggle.checked ? "dark-theme" : "light-theme");
        });
    }

    wrapToggle?.addEventListener("click", () => {
        toggleWrap();
    });

    diffWrapToggle?.addEventListener("click", () => {
        toggleWrap();
    });

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
        toggleWrap,
        openShortcutsModal: () => setShortcutsModalOpen(true),
        closeShortcutsModal: () => setShortcutsModalOpen(false)
    };
}
