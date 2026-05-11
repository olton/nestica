import * as vscode from 'vscode';

import { analyzeBracketPairs } from '../utils/bracket-analyzer';
import { isLanguageSupported } from './config';
import { normalizeTabSize } from '../utils/text-utils';
import { FEATURE_REGISTRY } from '../features/registry';
import { DecorationSets, GuideSettings } from './types';

export function createDecorationSets(colors: string[], guideSettings: GuideSettings): DecorationSets {
    const decorationSets = {} as DecorationSets;

    for (const feature of FEATURE_REGISTRY) {
        decorationSets[feature.id] = feature.createDecorationTypes(colors, guideSettings);
    }

    return decorationSets;
}

export function disposeDecorationSets(decorationSets: DecorationSets): void {
    for (const feature of FEATURE_REGISTRY) {
        for (const decorationType of decorationSets[feature.id]) {
            decorationType.dispose();
        }
    }
}

export function clearNesticaDecorations(editor: vscode.TextEditor, decorationSets: DecorationSets): void {
    for (const feature of FEATURE_REGISTRY) {
        for (const decorationType of decorationSets[feature.id]) {
            editor.setDecorations(decorationType, []);
        }
    }
}

export function applyNesticaDecorations(
    editor: vscode.TextEditor,
    decorationSets: DecorationSets,
    guideSettings: GuideSettings,
    colorizationEnabled: boolean,
): void {
    if (!colorizationEnabled) {
        clearNesticaDecorations(editor, decorationSets);
        return;
    }

    if (!isLanguageSupported(editor.document.languageId)) {
        clearNesticaDecorations(editor, decorationSets);
        return;
    }

    const tabSize = normalizeTabSize(editor.options.tabSize);

    const matches = analyzeBracketPairs(editor.document);

    for (const feature of FEATURE_REGISTRY) {
        const decorationTypes = decorationSets[feature.id];
        const rangesByColor = feature.collectRanges({
            document: editor.document,
            matches,
            colorCount: decorationTypes.length,
            tabSize,
            guideSettings,
        });
        const applyRanges = feature.shouldApply ? feature.shouldApply(guideSettings) : true;

        for (let i = 0; i < decorationTypes.length; i += 1) {
            editor.setDecorations(decorationTypes[i], applyRanges ? rangesByColor[i] : []);
        }
    }
}
