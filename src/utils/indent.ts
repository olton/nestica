export function getIndentString(level: number, tabSize: number, insertSpaces: boolean = true): string {
    if (insertSpaces) {
        return ' '.repeat(level * tabSize);
    } else {
        return '\t'.repeat(level);
    }
}
