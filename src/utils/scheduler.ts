import * as vscode from 'vscode';

const updateTimers = new Map<string, NodeJS.Timeout>();

export function scheduleRefresh(editor: vscode.TextEditor, applyFn: (editor: vscode.TextEditor) => void): void {
    const key = editor.document.uri.toString();
    const existing = updateTimers.get(key);

    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(() => {
        updateTimers.delete(key);
        applyFn(editor);
    }, 60);

    updateTimers.set(key, timer);
}

export function clearDocumentRefresh(doc: vscode.TextDocument): void {
    const key = doc.uri.toString();
    const timer = updateTimers.get(key);
    if (!timer) {
        return;
    }

    clearTimeout(timer);
    updateTimers.delete(key);
}

export function clearAllRefreshTimers(): void {
    for (const timer of updateTimers.values()) {
        clearTimeout(timer);
    }

    updateTimers.clear();
}