import * as vscode from 'vscode';

import { CLOSE_TO_OPEN, OPEN_TO_CLOSE } from '../core/constants';
import { BracketMatch, StackEntry } from '../core/types';

function shouldOffsetCurlyBraceLevel(document: vscode.TextDocument, braceIndex: number, parentCurlyLevel: number): boolean {
    if (parentCurlyLevel < 0) {
        return false;
    }

    const bracePos = document.positionAt(braceIndex);
    const linePrefix = document.lineAt(bracePos.line).text.slice(0, bracePos.character);

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

export function analyzeBracketPairs(document: vscode.TextDocument): BracketMatch[] {
    const text = document.getText();
    const stack: StackEntry[] = [];
    const matches: BracketMatch[] = [];

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

        if (matchIndex === -1) {
            continue;
        }

        stack.length = matchIndex + 1;
        const matched = stack.pop();
        if (!matched) {
            continue;
        }

        matches.push({
            open: document.positionAt(matched.index),
            close: document.positionAt(i),
            level: matched.level,
        });
    }

    return matches;
}