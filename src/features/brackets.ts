import * as vscode from 'vscode';

import { BracketMatch, FeatureModule } from '../core/types';

export function createBracketDecorationTypes(colors: string[]): vscode.TextEditorDecorationType[] {
    return colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
    );
}

export function collectBracketRangesByColor(document: vscode.TextDocument, matches: BracketMatch[], colorCount: number): vscode.Range[][] {
    const bracketRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);

    for (const match of matches) {
        const colorIndex = match.level % colorCount;

        const openLineText = document.lineAt(match.open.line).text;
        const openChar = openLineText[match.open.character];
        const hasClosingTagPrefix = openChar === '<' && openLineText[match.open.character + 1] === '/';

        if (hasClosingTagPrefix) {
            bracketRangesByColor[colorIndex].push(new vscode.Range(match.open, match.open.translate(0, 2)));
        } else {
            bracketRangesByColor[colorIndex].push(new vscode.Range(match.open, match.open.translate(0, 1)));
        }

        const lineText = document.lineAt(match.close.line).text;
        const closeChar = lineText[match.close.character];
        const hasSelfClosingSlash = closeChar === '>' && match.close.character > 0 && lineText[match.close.character - 1] === '/';

        if (hasSelfClosingSlash) {
            bracketRangesByColor[colorIndex].push(new vscode.Range(match.close.translate(0, -1), match.close.translate(0, 1)));
            continue;
        }

        bracketRangesByColor[colorIndex].push(new vscode.Range(match.close, match.close.translate(0, 1)));
    }

    return bracketRangesByColor;
}

export const bracketsFeature: FeatureModule = {
    id: 'brackets',
    createDecorationTypes: createBracketDecorationTypes,
    collectRanges: ({ document, matches, colorCount }) => collectBracketRangesByColor(document, matches, colorCount),
};
