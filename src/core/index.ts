import * as vscode from 'vscode';
import {
    CONFIG_BRACKETS_ENABLED_KEY,
    CONFIG_COLORS_KEY,
    CONFIG_LANGUAGES_KEY,
    CONFIG_PALETTE_KEY,
    CONFIG_GUIDES_ENABLED_KEY,
    CONFIG_GUIDES_OPACITY_KEY,
    CONFIG_GUIDES_THICKNESS_KEY,
    CONFIG_SECTION,
} from './constants';
import { getConfiguredColors, getGuideSettings, isColorizationEnabled } from './config';
import { clearAllRefreshTimers, clearDocumentRefresh, scheduleRefresh } from '../utils/scheduler';
import { applyNesticaDecorations, createDecorationSets, disposeDecorationSets as disposeEditorDecorationSets } from './decorations';
import { getOutputChannel, showOutputChannel } from './output';
import { DecorationSets } from './types';

export function activate(context: vscode.ExtensionContext): void {
    if (context.extensionMode === vscode.ExtensionMode.Development) {
        const outputChannel = getOutputChannel();
        context.subscriptions.push(outputChannel);
        showOutputChannel(true);
    }

    let colorizationEnabled = isColorizationEnabled();
    let guideSettings = getGuideSettings();
    let decorationSets: DecorationSets = createDecorationSets(getConfiguredColors(), guideSettings);

    const disposeDecorationSets = () => {
        disposeEditorDecorationSets(decorationSets);
    };

    const replaceDecorationSets = () => {
        disposeDecorationSets();
        const colors = getConfiguredColors();
        guideSettings = getGuideSettings();
        decorationSets = createDecorationSets(colors, guideSettings);
    };

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        applyNesticaDecorations(activeEditor, decorationSets, guideSettings, colorizationEnabled);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                scheduleRefresh(editor, (nextEditor) =>
                    applyNesticaDecorations(nextEditor, decorationSets, guideSettings, colorizationEnabled),
                );
            }
        }),
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document.uri.toString() !== editor.document.uri.toString()) {
                return;
            }

            scheduleRefresh(editor, (nextEditor) =>
                applyNesticaDecorations(nextEditor, decorationSets, guideSettings, colorizationEnabled),
            );
        }),

        vscode.workspace.onDidCloseTextDocument((doc) => {
            clearDocumentRefresh(doc);
        }),

        vscode.window.onDidChangeActiveColorTheme((theme) => {
            replaceDecorationSets();

            for (const editor of vscode.window.visibleTextEditors) {
                applyNesticaDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
            }
        }),

        vscode.workspace.onDidChangeConfiguration((event) => {
            const affectsEnabled = event.affectsConfiguration(CONFIG_BRACKETS_ENABLED_KEY);
            const affectsColors = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_COLORS_KEY}`);
            const affectsPalette = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_PALETTE_KEY}`);
            const affectsLanguages = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_LANGUAGES_KEY}`);
            const affectsGuideEnabled = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_ENABLED_KEY}`);
            const affectsGuideThickness = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_THICKNESS_KEY}`);
            const affectsGuideOpacity = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_OPACITY_KEY}`);
            const affectsWorkbenchTheme = event.affectsConfiguration('workbench.colorTheme');

            if (
                !affectsEnabled &&
                !affectsColors &&
                !affectsPalette &&
                !affectsLanguages &&
                !affectsGuideEnabled &&
                !affectsGuideThickness &&
                !affectsGuideOpacity &&
                !affectsWorkbenchTheme
            ) {
                return;
            }

            colorizationEnabled = isColorizationEnabled();

            if (
                affectsColors ||
                affectsPalette ||
                affectsGuideEnabled ||
                affectsGuideThickness ||
                affectsGuideOpacity ||
                affectsWorkbenchTheme
            ) {
                replaceDecorationSets();
            }

            for (const editor of vscode.window.visibleTextEditors) {
                applyNesticaDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
            }
        }),

        vscode.commands.registerCommand('nestica.refresh', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                applyNesticaDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
            }
        }),
        {
            dispose: () => {
                disposeDecorationSets();
            },
        },
    );
}

export function deactivate(): void {
    clearAllRefreshTimers();
}
