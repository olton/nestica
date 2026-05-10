import * as vscode from 'vscode';

import {
    CONFIG_BRACKETS_ENABLED_KEY,
    CONFIG_COLORS_KEY,
    CONFIG_LANGUAGES_KEY,
    CONFIG_SECTION,
    DEFAULT_BRACKET_COLORS,
    DEFAULT_LANGUAGE_IDS,
} from './constants';
import { getGuideSettings } from '../features/guides';

export function getConfiguredColors(): string[] {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const configured = config.get<string[]>(CONFIG_COLORS_KEY);

    if (!Array.isArray(configured) || configured.length === 0) {
        return DEFAULT_BRACKET_COLORS;
    }

    const normalized = configured
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return normalized.length > 0 ? normalized : DEFAULT_BRACKET_COLORS;
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

export {
    getGuideSettings,
}