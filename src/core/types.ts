import * as vscode from 'vscode';

export type StackEntry = {
  char: string;
  index: number;
  level: number;
};

export type BracketMatch = {
  open: vscode.Position;
  close: vscode.Position;
  level: number;
};

export type TagMatch = {
  open: vscode.Position;
  close: vscode.Position;
  level: number;
};

export type FeatureId = 'brackets' | 'guides' | 'jsonKeys' | 'xmlTags';

export type FeatureCollectContext = {
  document: vscode.TextDocument;
  matches: BracketMatch[];
  colorCount: number;
  tabSize: number;
  guideSettings: GuideSettings;
};

export type FeatureModule = {
  id: string;
  createDecorationTypes: (colors: string[], guideSettings: GuideSettings) => vscode.TextEditorDecorationType[];
  collectRanges: (context: FeatureCollectContext) => vscode.Range[][];
  shouldApply?: (guideSettings: GuideSettings) => boolean;
};

export type DecorationSets = Record<string, vscode.TextEditorDecorationType[]>;

export type GuideSettings = {
  enabled: boolean;
  thickness: number;
  opacity: number;
  fillEmptyLines: boolean;
};
