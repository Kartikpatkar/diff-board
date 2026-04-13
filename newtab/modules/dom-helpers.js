export function safeBind(id, handler, eventName = "click") {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(eventName, handler);
    }
    return el;
}

export function getActiveEditor(leftEditor, rightEditor) {
    const active = document.activeElement;
    if (active === leftEditor) return leftEditor;
    if (active === rightEditor) return rightEditor;
    return null;
}
