export const DEFAULT_BRACKET_COLORS = ['#61AFEF', '#E06C75', '#E5C07B', '#98C379', '#56B6C2', '#C678DD'];
export const DEFAULT_LANGUAGE_IDS = ['typescript', 'javascript', 'css', 'scss', 'less', 'json'];

export const CONFIG_SECTION = 'nestica';
export const CONFIG_BRACKETS_ENABLED_KEY = 'nestica.brackets.enabled';
export const CONFIG_COLORS_KEY = 'colors';
export const CONFIG_LANGUAGES_KEY = 'languages';
export const CONFIG_GUIDES_ENABLED_KEY = 'guides.enabled';
export const CONFIG_GUIDES_THICKNESS_KEY = 'guides.thickness';
export const CONFIG_GUIDES_OPACITY_KEY = 'guides.opacity';

export const OPEN_TO_CLOSE: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>',
};

export const CLOSE_TO_OPEN: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
    '>': '<',
};