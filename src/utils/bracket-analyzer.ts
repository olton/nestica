import * as vscode from 'vscode';

import { CLOSE_TO_OPEN, OPEN_TO_CLOSE } from '../core/constants';
import { BracketMatch, StackEntry } from '../core/types';

// Precompiled regex pattern for arrow function detection
const ARROW_FUNCTION_PATTERN = /\)\s*(?:(?::[^{}()]*)\s*(?:=>)?|=>)\s*$/;
const REGEX_EXPRESSION_PATTERN = /\/(?!\/|\*)(?:\\.|[^/\\\r\n])+\/[gimsuy]*/;

/**
 * Перевіряє, чи потрібно збільшити рівень вкладеності для фігурної дужки,
 * якщо вона розташована після стрілкової функції.
 */
function shouldOffsetCurlyBraceLevel(document: vscode.TextDocument, braceIndex: number, parentCurlyLevel: number): boolean {
    if (parentCurlyLevel < 0) {
        return false;
    }

    const bracePos = document.positionAt(braceIndex);
    const linePrefix = document.lineAt(bracePos.line).text.slice(0, bracePos.character);

    return ARROW_FUNCTION_PATTERN.test(linePrefix);
}

/**
 * Аналізує пари дужок у документі та повертає список зівнішніх відповідностей.
 * Враховує контекст: рядки, коментарі та регулярні вирази.
 */
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
    let isEscaped = false;

    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];

        // Обробка коментарів
        if (inLineComment) {
            if (ch === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (ch === '*' && text[i + 1] === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }

        // Обробка регулярних виразів
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
                // Всередині регулярного виразу можуть бути [] для character class
                // Вони не впливають на рівень вкладеності, але потрібно відстежувати закриття
                let bracketCount = 1;
                i++;
                while (i < text.length && bracketCount > 0) {
                    const innerCh = text[i];
                    if (isEscaped) {
                        isEscaped = false;
                        i++;
                        continue;
                    }

                    if (innerCh === '\\') {
                        isEscaped = true;
                        i++;
                        continue;
                    }

                    if (innerCh === '[') {
                        bracketCount++;
                    } else if (innerCh === ']') {
                        bracketCount--;
                    }
                    i++;
                }
                if (i < text.length && bracketCount === 0) {
                    // Закритий character class, продовжуємо з наступного символу
                    continue;
                }
                // Якщо не знайшли закриття, просто виходимо з регулярного виразу
                inRegexLiteral = false;
                continue;
            }

            if (ch === '/') {
                inRegexLiteral = false;
            }

            continue;
        }

        // Обробка рядків
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

        // Виявлення коментарів
        if (ch === '/' && text[i + 1] === '/') {
            inLineComment = true;
            i++;
            continue;
        }

        if (ch === '/' && text[i + 1] === '*') {
            inBlockComment = true;
            i++;
            continue;
        }

        // Виявлення регулярних виразів (перевірка, що це не операція ділення)
        if (!inRegexLiteral && ch === '/' && text[i + 1] !== '/' && text[i + 1] !== '*') {
            // Перевіряємо, чи є це початком регулярного виразу
            let prevCharIndex = i - 1;
            while (prevCharIndex >= 0 && /\s/.test(text[prevCharIndex])) {
                prevCharIndex--;
            }

            // Якщо досягли початку або перед / є символи, що вказують на регулярний вираз
            if (prevCharIndex < 0 || REGEX_EXPRESSION_PATTERN.test(text[prevCharIndex])) {
                inRegexLiteral = true;
                i++;
                continue;
            }
        }

        // Виявлення рядків
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

        // Обробка відкриваючих дужок (ігноруємо в регулярних виразах)
        if (inRegexLiteral) {
            // Продовжуємо обробку регулярного виразу
            // Nothing
        } else if (OPEN_TO_CLOSE[ch]) {
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

        // Обробка закриваючих дужок (ігноруємо в регулярних виразах)
        if (inRegexLiteral || !CLOSE_TO_OPEN[ch]) {
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
