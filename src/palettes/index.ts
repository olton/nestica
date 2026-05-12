import { DEFAULT_BRACKET_COLORS_DARK as defaultDark, DEFAULT_BRACKET_COLORS_LIGHT as defaultLight } from './colors_default';
import { DEFAULT_BRACKET_COLORS_DARK as pastelDark, DEFAULT_BRACKET_COLORS_LIGHT as pastelLight } from './colors_pastel';
import { DEFAULT_BRACKET_COLORS_DARK as neonDark, DEFAULT_BRACKET_COLORS_LIGHT as neonLight } from './colors_neon';
import { DEFAULT_BRACKET_COLORS_DARK as earthyDark, DEFAULT_BRACKET_COLORS_LIGHT as earthyLight } from './colors_earthy';
import { DEFAULT_BRACKET_COLORS_DARK as solarizedDark, DEFAULT_BRACKET_COLORS_LIGHT as solarizedLight } from './colors_solarized';
import { DEFAULT_BRACKET_COLORS_DARK as monochromeDark, DEFAULT_BRACKET_COLORS_LIGHT as monochromeLight } from './colors_monochrome';
import { DEFAULT_BRACKET_COLORS_DARK as candypopDark, DEFAULT_BRACKET_COLORS_LIGHT as candypopLight } from './colors_candypop';
import { DEFAULT_BRACKET_COLORS_DARK as retroDark, DEFAULT_BRACKET_COLORS_LIGHT as retroLight } from './colors_retro';
import { DEFAULT_BRACKET_COLORS_DARK as oceanDark, DEFAULT_BRACKET_COLORS_LIGHT as oceanLight } from './colors_ocean';
import { DEFAULT_BRACKET_COLORS_DARK as galaxyDark, DEFAULT_BRACKET_COLORS_LIGHT as galaxyLight } from './colors_galaxy';

export type PaletteColors = {
    dark: string[];
    light: string[];
};

export const PALETTES: Record<string, PaletteColors> = {
    default: {
        dark: defaultDark,
        light: defaultLight,
    },
    pastel: {
        dark: pastelDark,
        light: pastelLight,
    },
    neon: {
        dark: neonDark,
        light: neonLight,
    },
    earthy: {
        dark: earthyDark,
        light: earthyLight,
    },
    solarized: {
        dark: solarizedDark,
        light: solarizedLight,
    },
    monochrome: {
        dark: monochromeDark,
        light: monochromeLight,
    },
    candypop: {
        dark: candypopDark,
        light: candypopLight,
    },
    retro: {
        dark: retroDark,
        light: retroLight,
    },
    ocean: {
        dark: oceanDark,
        light: oceanLight,
    },
    galaxy: {
        dark: galaxyDark,
        light: galaxyLight,
    },
};

export const PALETTE_IDS = Object.keys(PALETTES);
