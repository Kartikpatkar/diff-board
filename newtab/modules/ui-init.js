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
    const body = document.body;

    const savedTheme = localStorage.getItem("theme") || "light-theme";
    body.classList.remove("light-theme", "dark-theme");
    body.classList.add(savedTheme);

    if (themeToggle) {
        themeToggle.checked = savedTheme === "dark-theme";
        themeToggle.addEventListener("change", () => {
            const theme = themeToggle.checked ? "dark-theme" : "light-theme";
            body.classList.remove("light-theme", "dark-theme");
            body.classList.add(theme);
            localStorage.setItem("theme", theme);
        });
    }
}
