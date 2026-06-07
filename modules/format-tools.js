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
    if (/(function|const|let|var|=>|import|export|class)\s+/.test(text)) return "javascript";
    if (/\{[^{}]*\}/.test(text) && /[a-zA-Z-]+\s*:/.test(text)) return "css";

    return "unknown";
}

/* ============================================================
   JAVASCRIPT TOKENIZER & SAFE ACTIONS
   ============================================================ */
export function tokenizeJavaScript(code) {
    const tokens = [];
    let i = 0;
    let current = "";
    let state = "code"; // code, string-single, string-double, template-literal, comment-line, comment-block, regex
    
    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1] || "";
        
        if (state === "code") {
            if (char === "/" && next === "/") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "comment-line";
                current = "//";
                i += 2;
                continue;
            } else if (char === "/" && next === "*") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "comment-block";
                current = "/*";
                i += 2;
                continue;
            } else if (char === "'") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "string-single";
                current = "'";
                i++;
                continue;
            } else if (char === '"') {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "string-double";
                current = '"';
                i++;
                continue;
            } else if (char === "`") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "template-literal";
                current = "`";
                i++;
                continue;
            } else if (char === "/") {
                // Determine division vs regex literal
                let isRegex = true;
                const trimmed = current.trim();
                if (trimmed) {
                    const lastChar = trimmed[trimmed.length - 1];
                    if (/[a-zA-Z0-9_\)\}\]]/.test(lastChar)) {
                        isRegex = false; 
                    }
                } else if (tokens.length > 0) {
                    const lastToken = tokens[tokens.length - 1];
                    if (lastToken.type === "code") {
                        const lastTrimmed = lastToken.value.trim();
                        if (lastTrimmed) {
                            const lastChar = lastTrimmed[lastTrimmed.length - 1];
                            if (/[a-zA-Z0-9_\)\}\]]/.test(lastChar)) {
                                isRegex = false;
                            }
                        }
                    }
                }
                
                if (isRegex) {
                    if (current) {
                        tokens.push({ type: "code", value: current });
                        current = "";
                    }
                    state = "regex";
                    current = "/";
                    i++;
                    continue;
                }
            }
            current += char;
            i++;
        } else if (state === "string-single") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === "'") {
                tokens.push({ type: "string", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "string-double") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === '"') {
                tokens.push({ type: "string", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "template-literal") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === "`") {
                tokens.push({ type: "string", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "regex") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === "/") {
                tokens.push({ type: "regex", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "comment-line") {
            if (char === "\n" || char === "\r") {
                current += char;
                tokens.push({ type: "comment-line", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                current += char;
                i++;
            }
        } else if (state === "comment-block") {
            current += char;
            if (char === "*" && next === "/") {
                current += "/";
                tokens.push({ type: "comment-block", value: current });
                current = "";
                state = "code";
                i += 2;
            } else {
                i++;
            }
        }
    }
    
    if (current) {
        tokens.push({ type: state === "code" ? "code" : (state.startsWith("comment") ? state : "string"), value: current });
    }
    
    return tokens;
}

function formatJavaScript(code) {
    const tokens = tokenizeJavaScript(code);
    let formatted = "";
    tokens.forEach(token => {
        if (token.type === "code") {
            formatted += token.value
                .replace(/\s*([{}()[\]=,;:+\-*/%&|^~!<>?])\s*/g, " $1 ")
                .replace(/\s+/g, " ")
                .replace(/([;{}])\s*/g, "$1\n")
                .replace(/([^\{\}])\{/g, "$1 {")
                .replace(/\}\s*/g, "}\n")
                .replace(/\n{3,}/g, "\n\n");
        } else {
            formatted += token.value;
        }
    });
    return normalizeNewlines(formatted).trim();
}

function minifyJavaScript(code) {
    const tokens = tokenizeJavaScript(code);
    let minified = "";
    tokens.forEach(token => {
        if (token.type === "code") {
            minified += token.value.replace(/\s+/g, " ");
        } else if (token.type === "string" || token.type === "regex") {
            minified += token.value;
        }
    });
    return normalizeNewlines(minified).trim();
}

/* ============================================================
   HTML TOKENIZER & SAFE ACTIONS
   ============================================================ */
function tokenizeHTML(code) {
    const tokens = [];
    let i = 0;
    let current = "";
    let state = "text"; // text, tag, comment
    let quoteState = ""; // tag-level quote state: single or double
    
    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1] || "";
        
        if (state === "text") {
            if (char === "<") {
                if (current) {
                    tokens.push({ type: "text", value: current });
                    current = "";
                }
                if (next === "!" && code[i + 2] === "-" && code[i + 3] === "-") {
                    state = "comment";
                    current = "<!--";
                    i += 4;
                    continue;
                } else {
                    state = "tag";
                    current = "<";
                    i++;
                    continue;
                }
            }
            current += char;
            i++;
        } else if (state === "tag") {
            current += char;
            if (quoteState === "") {
                if (char === "'") {
                    quoteState = "single";
                } else if (char === '"') {
                    quoteState = "double";
                } else if (char === ">") {
                    tokens.push({ type: "tag", value: current });
                    current = "";
                    state = "text";
                }
            } else if (quoteState === "single") {
                if (char === "'") {
                    quoteState = "";
                }
            } else if (quoteState === "double") {
                if (char === '"') {
                    quoteState = "";
                }
            }
            i++;
        } else if (state === "comment") {
            current += char;
            if (char === "-" && next === "-" && code[i + 2] === ">") {
                current += "->";
                tokens.push({ type: "comment", value: current });
                current = "";
                state = "text";
                i += 3;
            } else {
                i++;
            }
        }
    }
    
    if (current) {
        tokens.push({ type: state === "text" ? "text" : "tag", value: current });
    }
    
    return tokens;
}

function formatHTML(code) {
    const tokens = tokenizeHTML(code);
    let formatted = "";
    let indent = 0;
    
    tokens.forEach(token => {
        if (token.type === "tag") {
            const tag = token.value.trim();
            if (tag.startsWith("</")) {
                indent = Math.max(0, indent - 2);
            }
            
            formatted += "\n" + " ".repeat(indent) + tag;
            
            if (tag.startsWith("<") && !tag.startsWith("</") && !tag.endsWith("/>") && !tag.startsWith("<!")) {
                indent += 2;
            }
        } else if (token.type === "text") {
            const text = token.value.trim();
            if (text) {
                formatted += "\n" + " ".repeat(indent) + text;
            }
        } else if (token.type === "comment") {
            formatted += "\n" + " ".repeat(indent) + token.value.trim();
        }
    });
    
    return formatted.trim();
}

function minifyHTML(code) {
    const tokens = tokenizeHTML(code);
    let minified = "";
    tokens.forEach(token => {
        if (token.type === "tag") {
            minified += token.value.replace(/\s+/g, " ").trim();
        } else if (token.type === "text") {
            const text = token.value.trim();
            if (text) {
                minified += text.replace(/\s+/g, " ");
            }
        }
    });
    return minified.trim();
}

/* ============================================================
   CSS TOKENIZER & SAFE ACTIONS
   ============================================================ */
function tokenizeCSS(code) {
    const tokens = [];
    let i = 0;
    let current = "";
    let state = "code"; // code, comment, string-single, string-double
    
    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1] || "";
        
        if (state === "code") {
            if (char === "/" && next === "*") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "comment";
                current = "/*";
                i += 2;
                continue;
            } else if (char === "'") {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "string-single";
                current = "'";
                i++;
                continue;
            } else if (char === '"') {
                if (current) {
                    tokens.push({ type: "code", value: current });
                    current = "";
                }
                state = "string-double";
                current = '"';
                i++;
                continue;
            }
            current += char;
            i++;
        } else if (state === "string-single") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === "'") {
                tokens.push({ type: "string", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "string-double") {
            current += char;
            if (char === "\\") {
                current += next;
                i += 2;
            } else if (char === '"') {
                tokens.push({ type: "string", value: current });
                current = "";
                state = "code";
                i++;
            } else {
                i++;
            }
        } else if (state === "comment") {
            current += char;
            if (char === "*" && next === "/") {
                current += "/";
                tokens.push({ type: "comment", value: current });
                current = "";
                state = "code";
                i += 2;
            } else {
                i++;
            }
        }
    }
    
    if (current) {
        tokens.push({ type: state === "code" ? "code" : "string", value: current });
    }
    
    return tokens;
}

function formatCSS(code) {
    const tokens = tokenizeCSS(code);
    let formatted = "";
    tokens.forEach(token => {
        if (token.type === "code") {
            formatted += token.value
                .replace(/\s+/g, " ")
                .replace(/\s*{\s*/g, " {\n")
                .replace(/;\s*/g, ";\n")
                .replace(/\s*}\s*/g, "\n}\n")
                .replace(/\n{3,}/g, "\n\n");
        } else {
            formatted += token.value;
        }
    });
    return normalizeNewlines(formatted).trim();
}

function minifyCSS(code) {
    const tokens = tokenizeCSS(code);
    let minified = "";
    tokens.forEach(token => {
        if (token.type === "code") {
            minified += token.value
                .replace(/\s+/g, " ")
                .replace(/\s*([{}:;,])\s*/g, "$1");
        } else if (token.type === "string") {
            minified += token.value;
        }
    });
    return normalizeNewlines(minified).trim();
}

function formatGeneric(code) {
    return normalizeNewlines(code)
        .replace(/\t/g, "    ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/* ============================================================
   EXPORTED INTERFACE
   ============================================================ */
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
            const deepSortKeys = (value) => {
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
            };
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
