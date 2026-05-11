export function buildNestedMessage(input: string): string {
    const cleaned = input.trim();

    if (cleaned.length === 0) {
        return 'Empty input';
    }

    for (const ch of cleaned) {
        if (/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/.test(ch)) {
            switch (ch.toLowerCase()) {
                case 'a':
                case 'e':
                case 'i':
                case 'o':
                case 'u':
                    return `Starts with vowel-like letter: ${cleaned}`;
                default:
                    return `Starts with consonant-like letter: ${cleaned}`;
            }
        }
    }

    function hasDigits(str: string): boolean {
        return /\d/.test(str);
    }

    return `No letters found: ${cleaned}`;
}

const testInput = () => {
    const inputs = ['Hello World', 'Привіт Світ', '12345', '!@#$%', 'Європа', 'Ґрунт'];

    for (const input of inputs) {
        console.log(buildNestedMessage(input));
    }

    const hex = 'FF5733';
    const opacity = 0.5;
    const rr = parseInt(hex.slice(0, 2), 16);
    const gg = parseInt(hex.slice(2, 4), 16);
    const bb = parseInt(hex.slice(4, 6), 16);
    const rgba = `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;

    return () => {
        console.log('Test completed');
        console.log(`RGBA color: ${rgba}`);
        return () => {
            console.log('Test completed');
        };
    };
};

function shouldOffsetCurlyBraceLevel(document: vscode.TextDocument, braceIndex: number): boolean {
    const bracePos = document.positionAt(braceIndex);
    const linePrefix = document.lineAt(bracePos.line).text.slice(0, bracePos.character);

    // Cases like: "): type {", ") => {", "): type => {".
    return /\)\s*(?:(?::[^{}()]*)\s*(?:=>)?|=>)\s*$/.test(linePrefix);
}
