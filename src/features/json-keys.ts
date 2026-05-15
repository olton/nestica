import * as vscode from 'vscode';

import { BracketMatch, FeatureModule } from '../core/types';

type JsonContainer = {
  type: 'object' | 'array';
  level: number;
  expectingKey: boolean;
  expectingColon: boolean;
};

type PendingKey = {
  start: number;
  end: number;
  level: number;
};

export function createJsonKeyDecorationTypes(colors: string[]): vscode.TextEditorDecorationType[] {
  return colors.map((color) =>
    vscode.window.createTextEditorDecorationType({
      color,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    }),
  );
}

function isJsonLanguage(languageId: string): boolean {
  return languageId === 'json' || languageId === 'jsonc';
}

function buildOpenOffsetLevelMap(document: vscode.TextDocument, matches: BracketMatch[]): Map<number, number> {
  const openOffsetToLevel = new Map<number, number>();

  for (const match of matches) {
    const openOffset = document.offsetAt(match.open);
    openOffsetToLevel.set(openOffset, match.level);
  }

  return openOffsetToLevel;
}

export function collectJsonKeyRangesByColor(document: vscode.TextDocument, matches: BracketMatch[], colorCount: number): vscode.Range[][] {
  const keyRangesByColor = Array.from({ length: colorCount }, () => [] as vscode.Range[]);

  if (!isJsonLanguage(document.languageId)) {
    return keyRangesByColor;
  }

  const text = document.getText();
  const openOffsetToLevel = buildOpenOffsetLevelMap(document, matches);
  const stack: JsonContainer[] = [];

  const finalizedKeys: PendingKey[] = [];
  let pendingKey: PendingKey | null = null;

  let inString = false;
  let stringStart = -1;
  let stringEscaped = false;
  let keyCandidateLevel: number | null = null;

  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (stringEscaped) {
        stringEscaped = false;
        continue;
      }

      if (ch === '\\') {
        stringEscaped = true;
        continue;
      }

      if (ch === '"') {
        inString = false;

        if (keyCandidateLevel !== null) {
          pendingKey = {
            start: stringStart,
            end: i + 1,
            level: keyCandidateLevel,
          };

          const top = stack[stack.length - 1];
          if (top?.type === 'object') {
            top.expectingKey = false;
            top.expectingColon = true;
          }
        }

        keyCandidateLevel = null;
      }

      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inString = true;
      stringStart = i;
      stringEscaped = false;

      const top = stack[stack.length - 1];
      keyCandidateLevel = top?.type === 'object' && top.expectingKey ? top.level : null;
      continue;
    }

    if (ch === '{') {
      const level = openOffsetToLevel.get(i) ?? stack.length;
      stack.push({
        type: 'object',
        level,
        expectingKey: true,
        expectingColon: false,
      });
      pendingKey = null;
      continue;
    }

    if (ch === '[') {
      const level = openOffsetToLevel.get(i) ?? stack.length;
      stack.push({
        type: 'array',
        level,
        expectingKey: false,
        expectingColon: false,
      });
      pendingKey = null;
      continue;
    }

    if (ch === '}') {
      if (stack.length > 0) {
        stack.pop();
      }
      pendingKey = null;
      continue;
    }

    if (ch === ']') {
      if (stack.length > 0) {
        stack.pop();
      }
      pendingKey = null;
      continue;
    }

    const top = stack[stack.length - 1];
    if (top?.type !== 'object') {
      continue;
    }

    if (ch === ':' && top.expectingColon) {
      if (pendingKey) {
        finalizedKeys.push(pendingKey);
      }

      top.expectingColon = false;
      pendingKey = null;
      continue;
    }

    if (ch === ',') {
      top.expectingKey = true;
      top.expectingColon = false;
      pendingKey = null;
      continue;
    }
  }

  for (const key of finalizedKeys) {
    const colorIndex = key.level % colorCount;
    const range = new vscode.Range(document.positionAt(key.start), document.positionAt(key.end));
    keyRangesByColor[colorIndex].push(range);
  }

  return keyRangesByColor;
}

export const jsonKeysFeature: FeatureModule = {
  id: 'jsonKeys',
  createDecorationTypes: createJsonKeyDecorationTypes,
  collectRanges: ({ document, matches, colorCount }) => collectJsonKeyRangesByColor(document, matches, colorCount),
};
