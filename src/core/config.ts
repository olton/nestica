import * as vscode from 'vscode';

import {
    CONFIG_BRACKETS_ENABLED_KEY,
    CONFIG_COLORS_KEY,
    CONFIG_LANGUAGES_KEY,
    CONFIG_PALETTE_KEY,
    CONFIG_SECTION,
    DEFAULT_LANGUAGE_IDS,
} from './constants';
import { getGuideSettings } from '../features/guides';
import { PALETTES } from '../palettes';

const LEGACY_DARK_DEFAULTS = ['#E5C07B', '#98C379', '#56B6C2', '#61AFEF', '#C678DD', '#BE5046', '#D19A66', '#AF1320', '#E06C75'];

function isSamePalette(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    for (let i = 0; i < left.length; i += 1) {
        if (left[i].toLowerCase() !== right[i].toLowerCase()) {
            return false;
        }
    }

    return true;
}

function isLightTheme(): boolean {
    const themeName = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '').toLowerCase();

    if (themeName.includes('light')) {
        return true;
    }

    if (themeName.includes('dark')) {
        return false;
    }

    const kind = vscode.window.activeColorTheme.kind;
    return kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight;
}

function getThemeDefaultColors(): string[] {
    const configuredPaletteId = vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .get<string>(CONFIG_PALETTE_KEY, 'default')
        .trim()
        .toLowerCase();
    const selectedPalette = PALETTES[configuredPaletteId] ?? PALETTES.default;

    if (isLightTheme()) {
        return selectedPalette.light;
    }

    return selectedPalette.dark;
}

export function getConfiguredColors(): string[] {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const configured = config.get<string[]>(CONFIG_COLORS_KEY);
    const inspected = config.inspect<string[]>(CONFIG_COLORS_KEY);
    const hasExplicitColors =
        Array.isArray(inspected?.globalValue) || Array.isArray(inspected?.workspaceValue) || Array.isArray(inspected?.workspaceFolderValue);

    const normalized = (Array.isArray(configured) ? configured : [])
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (!hasExplicitColors) {
        return getThemeDefaultColors();
    }

    if (normalized.length > 0 && isSamePalette(normalized, LEGACY_DARK_DEFAULTS)) {
        return getThemeDefaultColors();
    }

    return normalized.length > 0 ? normalized : getThemeDefaultColors();
}

export function isColorizationEnabled(): boolean {
    const config = vscode.workspace.getConfiguration();
    return config.get<boolean>(CONFIG_BRACKETS_ENABLED_KEY, true);
}

export function getConfiguredLanguageIds(): string[] {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const configured = config.get<string[]>(CONFIG_LANGUAGES_KEY);

    if (!Array.isArray(configured) || configured.length === 0) {
        return DEFAULT_LANGUAGE_IDS;
    }

    const normalized = configured
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);

    return normalized.length > 0 ? normalized : DEFAULT_LANGUAGE_IDS;
}

export function isLanguageSupported(languageId: string): boolean {
    return getConfiguredLanguageIds().includes(languageId.toLowerCase());
}

export { getGuideSettings };
