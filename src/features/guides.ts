import * as vscode from 'vscode';

import { BracketMatch, FeatureModule, GuideSettings } from '../types';
import { findCharIndexAtVisualColumn, getVisualIndent } from '../core/text-utils';

function colorWithOpacity(color: string, opacity: number): string {
    const normalized = color.trim();

    const hex3 = /^#([\da-fA-F]{3})$/;
    const hex6 = /^#([\da-fA-F]{6})$/;

    const hex3Match = normalized.match(hex3);
    if (hex3Match) {
        const [r, g, b] = hex3Match[1].split('');
        const rr = parseInt(r + r, 16);
        const gg = parseInt(g + g, 16);
        const bb = parseInt(b + b, 16);
        return `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
    }

    const hex6Match = normalized.match(hex6);
    if (hex6Match) {
        const hex = hex6Match[1];
        const rr = parseInt(hex.slice(0, 2), 16);
        const gg = parseInt(hex.slice(2, 4), 16);
        const bb = parseInt(hex.slice(4, 6), 16);
        return `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
    }

    return normalized;
}

export function createGuideDecorationTypes(colors: string[], guideSettings: GuideSettings): vscode.TextEditorDecorationType[] {
    if (!guideSettings.enabled) {
        return colors.map(() =>
            vscode.window.createTextEditorDecorationType({
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            }),
        );
    }

    return colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            borderColor: colorWithOpacity(color, guideSettings.opacity),
            borderStyle: 'solid',
            borderWidth: `0 0 0 ${guideSettings.thickness}px`,
            rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,
        }),
    );
}

export function collectGuideRangesByColor(
    document: vscode.TextDocument,
    matches: BracketMatch[],
    colorCount: number,
    tabSize: number,
): vscode.Range[][] {
    const guideRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);

    for (const match of matches) {
        if (match.close.line <= match.open.line + 1) {
            continue;
        }

        const colorIndex = match.level % colorCount;
        const openLineText = document.lineAt(match.open.line).text;
        const guideColumn = getVisualIndent(openLineText, tabSize);

        for (let line = match.open.line + 1; line < match.close.line; line += 1) {
            const textLine = document.lineAt(line);
            const charIndex = findCharIndexAtVisualColumn(textLine.text, guideColumn, tabSize);
            if (charIndex === -1) {
                continue;
            }

            const pos = new vscode.Position(line, charIndex);
            const range = charIndex < textLine.text.length ? new vscode.Range(pos, pos.translate(0, 1)) : new vscode.Range(pos, pos);
            guideRangesByColor[colorIndex].push(range);
        }
    }

    return guideRangesByColor;
}

export const guidesFeature: FeatureModule = {
    id: 'guides',
    createDecorationTypes: createGuideDecorationTypes,
    collectRanges: ({ document, matches, colorCount, tabSize }) => collectGuideRangesByColor(document, matches, colorCount, tabSize),
    shouldApply: (guideSettings) => guideSettings.enabled,
};