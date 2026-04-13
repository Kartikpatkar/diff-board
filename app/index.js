import { ensureDiffLibrariesLoaded } from "../modules/library-loader.js";
import { initApp } from "../modules/app-init.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await ensureDiffLibrariesLoaded();
    } catch (error) {
        console.warn(error?.message || "Diff libraries failed to load in time.");
    }

    initApp();
});