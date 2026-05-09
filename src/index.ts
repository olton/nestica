import * as vscode from 'vscode';

const DEFAULT_BRACKET_COLORS = ['#E06C75', '#E5C07B', '#98C379', '#56B6C2', '#61AFEF', '#C678DD'];

const CONFIG_SECTION = 'rainbow';
const CONFIG_BRACKETS_ENABLED_KEY = 'rainbow.brackets.enabled';
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
            borderColor: color,
            borderStyle: 'solid',
            borderWidth: `0 0 0 ${guideSettings.thickness}px`,
            opacity: guideSettings.opacity.toString(),
            rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,
            // isWholeLine: не використовуємо!
        }),
    );
}

function collectBracketRanges(document: vscode.TextDocument, colorCount: number, tabSize: number): CollectedDecorations {
    const bracketRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);
    const guideRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);
    const text = document.getText();
    const stack: StackEntry[] = [];

    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];

        if (OPEN_TO_CLOSE[ch]) {
            if (ch === '{') {
                const colorIndex = stack.length % colorCount;
                let rightPartIndex = i - 1;

                while (rightPartIndex >= 0 && /\s/.test(text[rightPartIndex])) {
                    rightPartIndex -= 1;
                }

                const leftPartIndex = rightPartIndex - 1;
                if (rightPartIndex >= 0 && leftPartIndex >= 0 && text[rightPartIndex] === '>' && text[leftPartIndex] === '=') {
                    const arrowStart = document.positionAt(leftPartIndex);
                    const arrowEnd = document.positionAt(rightPartIndex + 1);
                    bracketRangesByColor[colorIndex].push(new vscode.Range(arrowStart, arrowEnd));
                }
            }

            stack.push({ char: ch, index: i, level: stack.length });
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
                    const range = charIndex < textLine.text.length
                        ? new vscode.Range(pos, pos.translate(0, 1))
                        : new vscode.Range(pos, pos);
                    guideRangesByColor[colorIndex].push(range);
                }
            }
        }
    }

    return { bracketRangesByColor, guideRangesByColor };
}

function clearRainbowDecorations(editor: vscode.TextEditor, decorationSets: DecorationSets): void {
    for (let i = 0; i < decorationSets.brackets.length; i += 1) {
        editor.setDecorations(decorationSets.brackets[i], []);
        editor.setDecorations(decorationSets.guides[i], []);
    }
}

function applyRainbowDecorations(
    editor: vscode.TextEditor,
    decorationSets: DecorationSets,
    guideSettings: GuideSettings,
    colorizationEnabled: boolean,
): void {
    if (!colorizationEnabled) {
        clearRainbowDecorations(editor, decorationSets);
        return;
    }

    const tabSize = normalizeTabSize(editor.options.tabSize);
    const { bracketRangesByColor, guideRangesByColor } = collectBracketRanges(editor.document, decorationSets.brackets.length, tabSize);

    for (let i = 0; i < decorationSets.brackets.length; i += 1) {
        editor.setDecorations(decorationSets.brackets[i], bracketRangesByColor[i]);
        editor.setDecorations(decorationSets.guides[i], guideSettings.enabled ? guideRangesByColor[i] : []);
    }
}

function scheduleRefresh(
    editor: vscode.TextEditor,
    decorationSets: DecorationSets,
    guideSettings: GuideSettings,
    colorizationEnabled: boolean,
): void {
    const key = editor.document.uri.toString();
    const existing = updateTimers.get(key);

    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(() => {
        updateTimers.delete(key);
        applyRainbowDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
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
        applyRainbowDecorations(activeEditor, decorationSets, guideSettings, colorizationEnabled);
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
                applyRainbowDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
            }
        }),
        vscode.commands.registerCommand('rainbow.refresh', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                applyRainbowDecorations(editor, decorationSets, guideSettings, colorizationEnabled);
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
