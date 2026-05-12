import * as vscode from 'vscode';
import { FeatureModule, GuideSettings, TagMatch } from '../core/types';
import { colorWithOpacity } from '../utils/color';

function toAttributeColor(color: string): string {
    return colorWithOpacity(color, 0.75);
}

export function createTagsDecorationTypes(colors: string[], guideSettings: GuideSettings): vscode.TextEditorDecorationType[] {
    const tagDecorations = colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
    );

    const attributeDecorations = colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            color: toAttributeColor(color),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
    );

    return [...tagDecorations, ...attributeDecorations];
}

export function collectTagRangesByColor(document: vscode.TextDocument, matches: TagMatch[], colorCount: number): vscode.Range[][] {
    const tagRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);
    const baseColorCount = Math.max(1, Math.floor(colorCount / 2));
    const attributesOffset = baseColorCount;

    const getTagText = (match: TagMatch): { tagText: string; baseOffset: number } => {
        const tagRange = new vscode.Range(match.open, match.close.translate(0, 1));
        return {
            tagText: document.getText(tagRange),
            baseOffset: document.offsetAt(match.open),
        };
    };

    const getTagNameRange = (match: TagMatch): vscode.Range | null => {
        const { tagText, baseOffset } = getTagText(match);
        const tagNameMatch = tagText.match(/^<\s*\/?\s*([A-Za-z_][\w:.-]*)/);

        if (!tagNameMatch || typeof tagNameMatch.index !== 'number') {
            return null;
        }

        const tagName = tagNameMatch[1];
        const fullMatch = tagNameMatch[0];
        const nameStartInMatch = fullMatch.lastIndexOf(tagName);
        if (nameStartInMatch < 0) {
            return null;
        }

        const nameStartOffset = baseOffset + tagNameMatch.index + nameStartInMatch;
        const nameEndOffset = nameStartOffset + tagName.length;

        return new vscode.Range(document.positionAt(nameStartOffset), document.positionAt(nameEndOffset));
    };

    const getAttributeNameRanges = (match: TagMatch): vscode.Range[] => {
        const { tagText, baseOffset } = getTagText(match);
        const openMatch = tagText.match(/^<\s*([A-Za-z_][\w:.-]*)/);
        if (!openMatch) {
            return [];
        }

        const ranges: vscode.Range[] = [];
        let i = openMatch[0].length;

        while (i < tagText.length) {
            while (i < tagText.length && /\s/.test(tagText[i])) {
                i += 1;
            }

            if (i >= tagText.length) {
                break;
            }

            const ch = tagText[i];
            if (ch === '>' || ch === '/') {
                break;
            }

            if (!/[A-Za-z_:]/.test(ch)) {
                i += 1;
                continue;
            }

            const nameStart = i;
            i += 1;
            while (i < tagText.length && /[\w:.-]/.test(tagText[i])) {
                i += 1;
            }

            const nameEnd = i;
            const attrStartOffset = baseOffset + nameStart;
            const attrEndOffset = baseOffset + nameEnd;
            ranges.push(new vscode.Range(document.positionAt(attrStartOffset), document.positionAt(attrEndOffset)));

            while (i < tagText.length && /\s/.test(tagText[i])) {
                i += 1;
            }

            if (i < tagText.length && tagText[i] === '=') {
                i += 1;
                while (i < tagText.length && /\s/.test(tagText[i])) {
                    i += 1;
                }

                if (i >= tagText.length) {
                    break;
                }

                const valueStart = tagText[i];
                if (valueStart === '"' || valueStart === "'") {
                    const quote = valueStart;
                    i += 1;
                    while (i < tagText.length && tagText[i] !== quote) {
                        i += 1;
                    }
                    if (i < tagText.length) {
                        i += 1;
                    }
                } else {
                    while (i < tagText.length && !/\s/.test(tagText[i]) && tagText[i] !== '>') {
                        i += 1;
                    }
                }
            }
        }

        return ranges;
    };

    for (const match of matches) {
        const colorIndex = match.level % baseColorCount;
        const attributeColorIndex = attributesOffset + colorIndex;

        const openLineText = document.lineAt(match.open.line).text;
        const openChar = openLineText[match.open.character];
        const hasClosingTagPrefix = openChar === '<' && openLineText[match.open.character + 1] === '/';

        if (hasClosingTagPrefix) {
            tagRangesByColor[colorIndex].push(new vscode.Range(match.open, match.open.translate(0, 2)));
        } else {
            tagRangesByColor[colorIndex].push(new vscode.Range(match.open, match.open.translate(0, 1)));
        }

        const tagNameRange = getTagNameRange(match);
        if (tagNameRange) {
            tagRangesByColor[colorIndex].push(tagNameRange);
        }

        for (const attrRange of getAttributeNameRanges(match)) {
            if (attributeColorIndex < tagRangesByColor.length) {
                tagRangesByColor[attributeColorIndex].push(attrRange);
            }
        }

        const closeLineText = document.lineAt(match.close.line).text;
        const closeChar = closeLineText[match.close.character];
        const hasSelfClosingSlash = closeChar === '>' && match.close.character > 0 && closeLineText[match.close.character - 1] === '/';

        if (hasSelfClosingSlash) {
            tagRangesByColor[colorIndex].push(new vscode.Range(match.close.translate(0, -1), match.close.translate(0, 1)));
            continue;
        }

        tagRangesByColor[colorIndex].push(new vscode.Range(match.close, match.close.translate(0, 1)));
    }

    return tagRangesByColor;
}

export const xmlTagsFeature: FeatureModule = {
    id: 'xmlTags',
    createDecorationTypes: (colors: string[], guideSettings: GuideSettings) => createTagsDecorationTypes(colors, guideSettings),
    collectRanges: ({ document, matches, colorCount }) => collectTagRangesByColor(document, matches as TagMatch[], colorCount),
};
