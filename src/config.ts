import * as vscode from 'vscode';

import {
    CONFIG_BRACKETS_ENABLED_KEY,
    CONFIG_COLORS_KEY,
    CONFIG_GUIDES_ENABLED_KEY,
    CONFIG_GUIDES_OPACITY_KEY,
    CONFIG_GUIDES_THICKNESS_KEY,
    CONFIG_SECTION,
    DEFAULT_BRACKET_COLORS,
} from './constants';
import { GuideSettings } from './types';

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

function normalizeGuideThickness(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.max(1, Math.min(6, Math.round(value)));
}

function normalizeGuideOpacity(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.max(0.1, Math.min(1, value));
}

export function getGuideSettings(): GuideSettings {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const enabled = config.get<boolean>(CONFIG_GUIDES_ENABLED_KEY, true);
    const thickness = normalizeGuideThickness(config.get<number>(CONFIG_GUIDES_THICKNESS_KEY, 1));
    const opacity = normalizeGuideOpacity(config.get<number>(CONFIG_GUIDES_OPACITY_KEY, 1));

    return {
        enabled,
        thickness,
        opacity,
    };
}