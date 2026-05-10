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
