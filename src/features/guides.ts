import * as vscode from 'vscode';

import { BracketMatch, FeatureModule, GuideSettings } from '../core/types';
import { findCharIndexAtVisualColumn, getVisualIndent } from '../utils/text-utils';
import {
    CONFIG_GUIDES_ENABLED_KEY,
    CONFIG_GUIDES_FILL_EMPTY_LINES_KEY,
    CONFIG_GUIDES_OPACITY_KEY,
    CONFIG_GUIDES_THICKNESS_KEY,
    CONFIG_SECTION,
} from '../core/constants';
import { colorWithOpacity, normalizeGuideOpacity, normalizeGuideThickness } from '../utils/color';

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
            let charIndex = findCharIndexAtVisualColumn(textLine.text, guideColumn, tabSize);

            if (charIndex === -1) {
                continue;
            }

            const pos = new vscode.Position(line, charIndex);
            const range = new vscode.Range(pos, pos);

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

export function getGuideSettings(): GuideSettings {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const enabled = config.get<boolean>(CONFIG_GUIDES_ENABLED_KEY, true);
    const thickness = normalizeGuideThickness(config.get<number>(CONFIG_GUIDES_THICKNESS_KEY, 1));
    const opacity = normalizeGuideOpacity(config.get<number>(CONFIG_GUIDES_OPACITY_KEY, 1));
    const fillEmptyLines = config.get<boolean>(CONFIG_GUIDES_FILL_EMPTY_LINES_KEY, true);

    return {
        enabled,
        thickness,
        opacity,
        fillEmptyLines,
    };
}
