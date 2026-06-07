function waitForLibrary(name, timeout = 5000, pollInterval = 30) {
    return new Promise((resolve, reject) => {
        let waited = 0;

        const interval = setInterval(() => {
            const lib = window[name];
            if (typeof lib !== "undefined") {
                clearInterval(interval);
                resolve(lib);
                return;
            }

            waited += pollInterval;
            if (waited >= timeout) {
                clearInterval(interval);
                reject(new Error(`${name} failed to load in time.`));
            }
        }, pollInterval);
    });
}

export async function ensureDiffLibrariesLoaded(timeout = 5000) {
    const [diff, diff2Html] = await Promise.all([
        waitForLibrary("Diff", timeout),
        waitForLibrary("Diff2Html", timeout)
    ]);

    // Keep explicit globals for modules that access window.Diff/window.Diff2Html.
    window.Diff = diff;
    window.Diff2Html = diff2Html;

    return { diff, diff2Html };
}
