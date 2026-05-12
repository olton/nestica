export function normalizeGuideThickness(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.max(1, Math.min(6, Math.round(value)));
}

export function normalizeGuideOpacity(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.max(0.1, Math.min(1, value));
}

export function colorWithOpacity(color: string, opacity: number): string {
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
