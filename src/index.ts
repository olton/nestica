import * as vscode from 'vscode';

const DEFAULT_BRACKET_COLORS = ['#61AFEF', '#E06C75', '#E5C07B', '#98C379', '#56B6C2', '#C678DD'];

const CONFIG_SECTION = 'nestica';
const CONFIG_BRACKETS_ENABLED_KEY = 'nestica.brackets.enabled';
const CONFIG_COLORS_KEY = 'colors';
const CONFIG_GUIDES_ENABLED_KEY = 'guides.enabled';
const CONFIG_GUIDES_THICKNESS_KEY = 'guides.thickness';
const CONFIG_GUIDES_OPACITY_KEY = 'guides.opacity';

const OPEN_TO_CLOSE: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>',
};

const CLOSE_TO_OPEN: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
    '>': '<',
};

type StackEntry = {
    char: string;
    index: number;
    level: number;
};

type CollectedDecorations = {
    bracketRangesByColor: vscode.Range[][];
    guideRangesByColor: vscode.Range[][];
};

type DecorationSets = {
    brackets: vscode.TextEditorDecorationType[];
    guides: vscode.TextEditorDecorationType[];
};

type GuideSettings = {
    enabled: boolean;
    thickness: number;
    opacity: number;
};

const updateTimers = new Map<string, any>();

function normalizeTabSize(tabSize: vscode.TextEditorOptions['tabSize']): number {
    if (typeof tabSize === 'number' && Number.isFinite(tabSize) && tabSize > 0) {
        return Math.floor(tabSize);
    }

    return 4;
}

function getVisualIndent(lineText: string, tabSize: number): number {
    let visual = 0;

    for (const ch of lineText) {
        if (ch === ' ') {
            visual += 1;
            continue;
        }

        if (ch === '\t') {
            const nextStop = Math.floor(visual / tabSize) * tabSize + tabSize;
            visual = nextStop;
            continue;
        }

        break;
    }

    return visual;
}

function findCharIndexAtVisualColumn(lineText: string, targetVisualColumn: number, tabSize: number): number {
    let visual = 0;

    for (let i = 0; i < lineText.length; i += 1) {
        if (visual >= targetVisualColumn) {
            return i;
        }

        const ch = lineText[i];
        const charVisualWidth = ch === '\t' ? tabSize - (visual % tabSize) : 1;
        visual += charVisualWidth;
    }

    if (visual >= targetVisualColumn) {
        return lineText.length;
    }

    return -1;
}

function getConfiguredColors(): string[] {
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

function isColorizationEnabled(): boolean {
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

function getGuideSettings(): GuideSettings {
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

function colorWithOpacity(color: string, opacity: number): string {
    const normalized = color.trim();

    const hex3 = /^#([\da-fA-F]{3})$/;
    const hex6 = /^#([\da-fA-F]{6})$/;

    const hex3Match = normalized.match(hex3);
    if (hex3Match) {
        const [r, g, b] = hex3Match[1].split('');
        const rr = parseInt(r + r, 16);
        const gg = parseInt(g + g, 16);
        const bb = parseInt(b + b, 16);
        return `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
    }

    const hex6Match = normalized.match(hex6);
    if (hex6Match) {
        const hex = hex6Match[1];
        const rr = parseInt(hex.slice(0, 2), 16);
        const gg = parseInt(hex.slice(2, 4), 16);
        const bb = parseInt(hex.slice(4, 6), 16);
        return `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
    }

    return normalized;
}

function createBracketDecorationTypes(colors: string[]): vscode.TextEditorDecorationType[] {
    return colors.map((color) =>
        vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
    );
}

function createGuideDecorationTypes(colors: string[], guideSettings: GuideSettings): vscode.TextEditorDecorationType[] {
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
            // isWholeLine: не використовуємо!
        }),
    );
}

function shouldOffsetCurlyBraceLevel(document: vscode.TextDocument, braceIndex: number, parentCurlyLevel: number): boolean {
    // Keep top-level blocks unshifted so inner control-flow blocks get the next color level.
    if (parentCurlyLevel < 0) {
        return false;
    }

    const bracePos = document.positionAt(braceIndex);
    const linePrefix = document.lineAt(bracePos.line).text.slice(0, bracePos.character);

    // Function-like blocks: "): type {", ") => {", "): type => {".
    return /\)\s*(?:(?::[^{}()]*)\s*(?:=>)?|=>)\s*$/.test(linePrefix);
}

function isLikelyRegexLiteralStart(text: string, slashIndex: number): boolean {
    let i = slashIndex - 1;

    while (i >= 0 && /\s/.test(text[i])) {
        i -= 1;
    }

    if (i < 0) {
        return true;
    }

    return /[\(\[\{=,:;!&|?+\-*%^~<>]/.test(text[i]);
}

function collectBracketRanges(document: vscode.TextDocument, colorCount: number, tabSize: number): CollectedDecorations {
    const bracketRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);
    const guideRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);
    const text = document.getText();
    const stack: StackEntry[] = [];
    let inSingleQuotedString = false;
    let inDoubleQuotedString = false;
    let inTemplateString = false;
    let inLineComment = false;
    let inBlockComment = false;
    let inRegexLiteral = false;
    let inRegexCharClass = false;
    let isEscaped = false;

    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];

        if (inLineComment) {
            if (ch === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (ch === '*' && text[i + 1] === '/') {
                inBlockComment = false;
                i += 1;
            }
            continue;
        }

        if (inRegexLiteral) {
            if (isEscaped) {
                isEscaped = false;
                continue;
            }

            if (ch === '\\') {
                isEscaped = true;
                continue;
            }

            if (ch === '[') {
                inRegexCharClass = true;
                continue;
            }

            if (ch === ']' && inRegexCharClass) {
                inRegexCharClass = false;
                continue;
            }

            if (ch === '/' && !inRegexCharClass) {
                inRegexLiteral = false;
            }

            continue;
        }

        if (inSingleQuotedString || inDoubleQuotedString || inTemplateString) {
            if (isEscaped) {
                isEscaped = false;
                continue;
            }

            if (ch === '\\') {
                isEscaped = true;
                continue;
            }

            if (inSingleQuotedString && ch === "'") {
                inSingleQuotedString = false;
                continue;
            }

            if (inDoubleQuotedString && ch === '"') {
                inDoubleQuotedString = false;
                continue;
            }

            if (inTemplateString && ch === '`') {
                inTemplateString = false;
                continue;
            }

            continue;
        }

        if (ch === '/' && text[i + 1] === '/') {
            inLineComment = true;
            i += 1;
            continue;
        }

        if (ch === '/' && text[i + 1] === '*') {
            inBlockComment = true;
            i += 1;
            continue;
        }

        if (ch === '/' && text[i + 1] !== '/' && text[i + 1] !== '*' && isLikelyRegexLiteralStart(text, i)) {
            inRegexLiteral = true;
            inRegexCharClass = false;
            continue;
        }

        if (ch === "'") {
            inSingleQuotedString = true;
            continue;
        }

        if (ch === '"') {
            inDoubleQuotedString = true;
            continue;
        }

        if (ch === '`') {
            inTemplateString = true;
            continue;
        }

        if (OPEN_TO_CLOSE[ch]) {
            let level = stack.length;

            if (ch === '{') {
                let parentCurlyLevel = -1;
                for (let j = stack.length - 1; j >= 0; j -= 1) {
                    if (stack[j].char === '{') {
                        parentCurlyLevel = stack[j].level;
                        break;
                    }
                }

                const baseLevel = parentCurlyLevel + 1;
                level = shouldOffsetCurlyBraceLevel(document, i, parentCurlyLevel) ? baseLevel + 1 : baseLevel;
            }

            stack.push({ char: ch, index: i, level });
            continue;
        }

        if (!CLOSE_TO_OPEN[ch]) {
            continue;
        }

        const expectedOpen = CLOSE_TO_OPEN[ch];

        if (stack.length === 0) {
            continue;
        }

        let matchIndex = -1;
        for (let j = stack.length - 1; j >= 0; j -= 1) {
            if (stack[j].char === expectedOpen) {
                matchIndex = j;
                break;
            }
        }

        // No opener of this type is available.
        if (matchIndex === -1) {
            continue;
        }

        // Drop unclosed unmatched openers above the matched one.
        stack.length = matchIndex + 1;
        const matched = stack.pop();
        if (!matched) {
            continue;
        }

        const colorIndex = matched.level % colorCount;

        const openPos = document.positionAt(matched.index);
        const closePos = document.positionAt(i);

        bracketRangesByColor[colorIndex].push(new vscode.Range(openPos, openPos.translate(0, 1)));
        bracketRangesByColor[colorIndex].push(new vscode.Range(closePos, closePos.translate(0, 1)));

        if (closePos.line > openPos.line + 1) {
            const openLineText = document.lineAt(openPos.line).text;
            const guideColumn = getVisualIndent(openLineText, tabSize);

            for (let line = openPos.line + 1; line < closePos.line; line++) {
                const textLine = document.lineAt(line);
                const charIndex = findCharIndexAtVisualColumn(textLine.text, guideColumn, tabSize);

                if (charIndex !== -1) {
                    const pos = new vscode.Position(line, charIndex);
                    // Використовуємо діапазон в один символ для того, щоб декорація (border-left) була видимою.
                    const range = charIndex < textLine.text.length ? new vscode.Range(pos, pos.translate(0, 1)) : new vscode.Range(pos, pos);
                    guideRangesByColor[colorIndex].push(range);
                }
            }
        }
    }

    return { bracketRangesByColor, guideRangesByColor };
}

function clearNesticaDecorations(editor: vscode.TextEditor, decorationSets: DecorationSets): void {
    for (let i = 0; i < decorationSets.brackets.length; i += 1) {
        editor.setDecorations(decorationSets.brackets[i], []);
        editor.setDecorations(decorationSets.guides[i], []);
    }
}

function applyNesticaDecorations(editor: vscode.TextEditor, decorationSets: DecorationSets, guideSettings: GuideSettings, colorizationEnabled: boolean): void {
    if (!colorizationEnabled) {
        clearNesticaDecorations(editor, decorationSets);
        return;
    }

    const tabSize = normalizeTabSize(editor.options.tabSize);
    const { bracketRangesByColor, guideRangesByColor } = collectBracketRanges(editor.document, decorationSets.brackets.length, tabSize);

    for (let i = 0; i < decorationSets.brackets.length; i += 1) {
        editor.setDecorations(decorationSets.brackets[i], bracketRangesByColor[i]);
        editor.setDecorations(decorationSets.guides[i], guideSettings.enabled ? guideRangesByColor[i] : []);
    }
}

function scheduleRefresh(editor: vscode.TextEditor, decorationSets: DecorationSets, guideSettings: GuideSettings, colorizationEnabled: boolean): void {
    const key = editor.document.uri.toString();
    const existing = updateTimers.get(key);

    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(() => {
        updateTimers.delete(key);
        applyNesticaDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
    }, 60);

    updateTimers.set(key, timer);
}

export function activate(context: vscode.ExtensionContext): void {
    let colorizationEnabled = isColorizationEnabled();
    let guideSettings = getGuideSettings();
    let decorationSets: DecorationSets = {
        brackets: createBracketDecorationTypes(getConfiguredColors()),
        guides: createGuideDecorationTypes(getConfiguredColors(), guideSettings),
    };

    const disposeDecorationSets = () => {
        for (const decorationType of decorationSets.brackets) {
            decorationType.dispose();
        }

        for (const decorationType of decorationSets.guides) {
            decorationType.dispose();
        }
    };

    const replaceDecorationSets = () => {
        disposeDecorationSets();
        const colors = getConfiguredColors();
        guideSettings = getGuideSettings();
        decorationSets = {
            brackets: createBracketDecorationTypes(colors),
            guides: createGuideDecorationTypes(colors, guideSettings),
        };
    };

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        applyNesticaDecorations(activeEditor, decorationSets, guideSettings, colorizationEnabled);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                scheduleRefresh(editor, decorationSets, guideSettings, colorizationEnabled);
            }
        }),
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document.uri.toString() !== editor.document.uri.toString()) {
                return;
            }

            scheduleRefresh(editor, decorationSets, guideSettings, colorizationEnabled);
        }),

        vscode.workspace.onDidCloseTextDocument((doc) => {
            const key = doc.uri.toString();
            const timer = updateTimers.get(key);
            if (timer) {
                clearTimeout(timer);
                updateTimers.delete(key);
            }
        }),

        vscode.workspace.onDidChangeConfiguration((event) => {
            const affectsEnabled = event.affectsConfiguration(CONFIG_BRACKETS_ENABLED_KEY);
            const affectsColors = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_COLORS_KEY}`);
            const affectsGuideEnabled = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_ENABLED_KEY}`);
            const affectsGuideThickness = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_THICKNESS_KEY}`);
            const affectsGuideOpacity = event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_GUIDES_OPACITY_KEY}`);

            if (!affectsEnabled && !affectsColors && !affectsGuideEnabled && !affectsGuideThickness && !affectsGuideOpacity) {
                return;
            }

            colorizationEnabled = isColorizationEnabled();

            if (affectsColors || affectsGuideEnabled || affectsGuideThickness || affectsGuideOpacity) {
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
    for (const timer of updateTimers.values()) {
        clearTimeout(timer);
    }
    updateTimers.clear();
}
