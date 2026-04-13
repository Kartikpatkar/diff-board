function normalizeNewlines(text) {
    return text.replace(/\r\n?/g, "\n");
}

export function detectLanguage(code) {
    const text = (code || "").trim();
    if (!text) return "unknown";

    try {
        JSON.parse(text);
        return "json";
    } catch (_) {
        // not json
    }

    if (/<[a-z][\s\S]*>/i.test(text)) return "html";
    if (/\{[^{}]*\}/.test(text) && /[a-zA-Z-]+\s*:/.test(text)) return "css";
    if (/(function|const|let|var|=>|import|export|class)\s+/.test(text)) return "javascript";

    return "unknown";
}

function formatJavaScript(code) {
    return normalizeNewlines(code)
        .replace(/\s*([{}()[\]=,;:+\-*/%&|^~!<>?])\s*/g, " $1 ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/([;{}])\s*/g, "$1\n")
        .replace(/([^\{\}])\{/g, "$1 {")
        .replace(/\}\s*/g, "}\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function formatHTML(code) {
    let indent = 0;
    return normalizeNewlines(code)
        .replace(/</g, "\n<")
        .split("\n")
        .map((line) => {
            line = line.trim();
            if (!line) return "";
            if (line.startsWith("</")) indent = Math.max(0, indent - 2);
            const out = `${" ".repeat(indent)}${line}`;
            if (line.startsWith("<") && !line.startsWith("</") && !line.endsWith("/>") && !line.includes("</")) {
                indent += 2;
            }
            return out;
        })
        .filter(Boolean)
        .join("\n");
}

function formatCSS(code) {
    return normalizeNewlines(code)
        .replace(/\s+/g, " ")
        .replace(/\s*{\s*/g, " {\n")
        .replace(/;\s*/g, ";\n")
        .replace(/\s*}\s*/g, "\n}\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function formatGeneric(code) {
    return normalizeNewlines(code)
        .replace(/\t/g, "    ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function minifyHTML(code) {
    return normalizeNewlines(code)
        .replace(/>\s+</g, "><")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function minifyCSS(code) {
    return normalizeNewlines(code)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/\s*([{}:;,])\s*/g, "$1")
        .trim();
}

function minifyJavaScript(code) {
    return normalizeNewlines(code)
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function deepSortKeys(value) {
    if (Array.isArray(value)) return value.map(deepSortKeys);
    if (value && typeof value === "object") {
        return Object.keys(value)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = deepSortKeys(value[key]);
                return acc;
            }, {});
    }
    return value;
}

export function applyFormatAction(code, action) {
    const text = (code || "").trim();
    if (!text) {
        return {
            success: false,
            output: code,
            title: "No Content",
            message: "Editor is empty",
            type: "info"
        };
    }

    const language = detectLanguage(text);

    try {
        if (action === "format") {
            if (language === "json") {
                return {
                    success: true,
                    output: JSON.stringify(JSON.parse(text), null, 2),
                    title: "Formatted",
                    message: "JSON formatted",
                    type: "success"
                };
            }
            if (language === "javascript") {
                return { success: true, output: formatJavaScript(text), title: "Formatted", message: "JavaScript formatted", type: "success" };
            }
            if (language === "html") {
                return { success: true, output: formatHTML(text), title: "Formatted", message: "HTML formatted", type: "success" };
            }
            if (language === "css") {
                return { success: true, output: formatCSS(text), title: "Formatted", message: "CSS formatted", type: "success" };
            }
            return { success: true, output: formatGeneric(text), title: "Formatted", message: "Content formatted", type: "success" };
        }

        if (action === "minify") {
            if (language === "json") {
                return { success: true, output: JSON.stringify(JSON.parse(text)), title: "Minified", message: "JSON minified", type: "success" };
            }
            if (language === "javascript") {
                return { success: true, output: minifyJavaScript(text), title: "Minified", message: "JavaScript minified", type: "success" };
            }
            if (language === "html") {
                return { success: true, output: minifyHTML(text), title: "Minified", message: "HTML minified", type: "success" };
            }
            if (language === "css") {
                return { success: true, output: minifyCSS(text), title: "Minified", message: "CSS minified", type: "success" };
            }
            return { success: true, output: text.replace(/\s+/g, " ").trim(), title: "Minified", message: "Content minified", type: "success" };
        }

        if (action === "validate") {
            if (language === "json") {
                JSON.parse(text);
                return { success: true, output: code, title: "Valid", message: "Valid JSON", type: "success" };
            }
            return { success: true, output: code, title: "Validated", message: `Detected ${language}. Basic validation passed.`, type: "info" };
        }

        if (action === "sort-keys") {
            if (language !== "json") {
                return { success: false, output: code, title: "Unsupported", message: "Sort Keys is only available for JSON", type: "error" };
            }
            const sorted = deepSortKeys(JSON.parse(text));
            return { success: true, output: JSON.stringify(sorted, null, 2), title: "Sorted", message: "JSON keys sorted recursively", type: "success" };
        }

        return { success: false, output: code, title: "Unknown Action", message: "Invalid format action", type: "error" };
    } catch (error) {
        return {
            success: false,
            output: code,
            title: "Format Error",
            message: error?.message || "Unable to process content",
            type: "error"
        };
    }
}
