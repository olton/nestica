export const DEFAULT_LANGUAGE_IDS = [
    'typescript',
    'javascript',
    'css',
    'scss',
    'less',
    'json',
    'jsonc',
    'xml',
    'vue',
    'html',
    'jsx',
    'tsx',
    'c',
    'cpp',
    'csharp',
    'java',
    'go',
    'rust',
    'php',
    'swift',
    'kotlin',
    'dart',
    'objective-c',
    'objective-cpp',
    'scala',
    'groovy',
    'perl',
    'ruby',
    'shaderlab',
    'glsl',
    'hlsl',
    'fsharp',
    'vala',
    'verilog',
    'systemverilog',
    'actionscript',
    'coffeescript',
    'qml',
    'cuda-cpp',
    'nim',
    'crystal',
    'v',
    'solidity',
    'elm',
    'd',
    'plaintext',
];

export const CONFIG_SECTION = 'nestica';
export const CONFIG_BRACKETS_ENABLED_KEY = 'nestica.brackets.enabled';
export const CONFIG_COLORS_KEY = 'colors';
export const CONFIG_PALETTE_KEY = 'palette';
export const CONFIG_LANGUAGES_KEY = 'languages';
export const CONFIG_GUIDES_ENABLED_KEY = 'guides.enabled';
export const CONFIG_GUIDES_THICKNESS_KEY = 'guides.thickness';
export const CONFIG_GUIDES_OPACITY_KEY = 'guides.opacity';
export const CONFIG_GUIDES_FILL_EMPTY_LINES_KEY = 'guides.fillEmptyLines';

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
