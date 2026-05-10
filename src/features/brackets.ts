import * as vscode from 'vscode';

import { BracketMatch, FeatureModule } from '../types';

export function createBracketDecorationTypes(colors: string[]): vscode.TextEditorDecorationType[] {
    return colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
    );
}

export function collectBracketRangesByColor(matches: BracketMatch[], colorCount: number): vscode.Range[][] {
    const bracketRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);

    for (const match of matches) {
        const colorIndex = match.level % colorCount;
        bracketRangesByColor[colorIndex].push(new vscode.Range(match.open, match.open.translate(0, 1)));
        bracketRangesByColor[colorIndex].push(new vscode.Range(match.close, match.close.translate(0, 1)));
    }

    return bracketRangesByColor;
}

export const bracketsFeature: FeatureModule = {
    id: 'brackets',
    createDecorationTypes: createBracketDecorationTypes,
    collectRanges: ({ matches, colorCount }) => collectBracketRangesByColor(matches, colorCount),
};