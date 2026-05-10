import * as vscode from 'vscode';

export function normalizeTabSize(tabSize: vscode.TextEditorOptions['tabSize']): number {
    if (typeof tabSize === 'number' && Number.isFinite(tabSize) && tabSize > 0) {
        return Math.floor(tabSize);
    }

    return 4;
}

export function getVisualIndent(lineText: string, tabSize: number): number {
    let visual = 0;

    for (const ch of lineText) {
        if (ch === ' ') {
            visual += 1;
            continue;
        }

        if (ch === '\t') {
            const nextStop = Math.floor(visual / tabSize) * tabSize + tabSize;
            visual = nextStop;
            continue;
        }

        break;
    }

    return visual;
}

export function findCharIndexAtVisualColumn(lineText: string, targetVisualColumn: number, tabSize: number): number {
    let visual = 0;

    for (let i = 0; i < lineText.length; i += 1) {
        if (visual >= targetVisualColumn) {
            return i;
        }

        const ch = lineText[i];
        const charVisualWidth = ch === '\t' ? tabSize - (visual % tabSize) : 1;
        visual += charVisualWidth;
    }

    if (visual >= targetVisualColumn) {
        return lineText.length;
    }

    return -1;
}