import * as vscode from 'vscode';

import { TagMatch } from '../core/types';

export const analyzeTagPairs = (document: vscode.TextDocument): TagMatch[] => {
    const text = document.getText();
    const matches: TagMatch[] = [];
    const stack: Array<{ name: string; level: number }> = [];
    let rawTextTagName: string | null = null;

    const readTagEnd = (start: number): number => {
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = start + 1; i < text.length; i += 1) {
            const ch = text[i];

            if (ch === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                continue;
            }

            if (ch === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }

            if (ch === '>' && !inSingleQuote && !inDoubleQuote) {
                return i;
            }
        }

        return -1;
    };

    for (let i = 0; i < text.length; i += 1) {
        if (text[i] !== '<') {
            continue;
        }

        if (rawTextTagName) {
            const rawTextCloseMatch = text.slice(i).match(/^<\s*\/\s*([A-Za-z_][\w:.-]*)\s*>/);
            if (!rawTextCloseMatch || rawTextCloseMatch[1].toLowerCase() !== rawTextTagName) {
                continue;
            }
        }

        if (text.startsWith('<!--', i)) {
            const commentEnd = text.indexOf('-->', i + 4);
            if (commentEnd === -1) {
                break;
            }
            i = commentEnd + 2;
            continue;
        }

        if (text.startsWith('<![CDATA[', i)) {
            const cdataEnd = text.indexOf(']]>', i + 9);
            if (cdataEnd === -1) {
                break;
            }
            i = cdataEnd + 2;
            continue;
        }

        if (text.startsWith('<?', i)) {
            const instructionEnd = text.indexOf('?>', i + 2);
            if (instructionEnd === -1) {
                break;
            }
            i = instructionEnd + 1;
            continue;
        }

        const tagEnd = readTagEnd(i);
        if (tagEnd === -1) {
            break;
        }

        const rawTagBody = text.slice(i + 1, tagEnd).trim();
        if (rawTagBody.length === 0 || rawTagBody.startsWith('!')) {
            i = tagEnd;
            continue;
        }

        const closingMatch = rawTagBody.match(/^\s*\/\s*([A-Za-z_][\w:.-]*)/);
        if (closingMatch) {
            const closingName = closingMatch[1].toLowerCase();
            let matchIndex = -1;

            for (let j = stack.length - 1; j >= 0; j -= 1) {
                if (stack[j].name === closingName) {
                    matchIndex = j;
                    break;
                }
            }

            const level = matchIndex >= 0 ? stack[matchIndex].level : Math.max(stack.length - 1, 0);
            matches.push({
                open: document.positionAt(i),
                close: document.positionAt(tagEnd),
                level,
            });

            if (matchIndex >= 0) {
                stack.length = matchIndex;
            }

            if (rawTextTagName === closingName) {
                rawTextTagName = null;
            }

            i = tagEnd;
            continue;
        }

        const openingMatch = rawTagBody.match(/^\s*([A-Za-z_][\w:.-]*)/);
        if (!openingMatch) {
            i = tagEnd;
            continue;
        }

        const isSelfClosing = /\/\s*$/.test(rawTagBody);
        const openingName = openingMatch[1].toLowerCase();
        const level = stack.length;

        matches.push({
            open: document.positionAt(i),
            close: document.positionAt(tagEnd),
            level,
        });

        if (!isSelfClosing) {
            stack.push({
                name: openingName,
                level,
            });

            if (openingName === 'script' || openingName === 'style') {
                rawTextTagName = openingName;
            }
        }

        i = tagEnd;
    }

    return matches;
};
