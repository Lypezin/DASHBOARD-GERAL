function normalizeForRequestKey(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalizeForRequestKey);
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    const source = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    Object.keys(source)
        .sort()
        .forEach((key) => {
            const item = source[key];
            if (item !== undefined) {
                normalized[key] = normalizeForRequestKey(item);
            }
        });

    return normalized;
}

export function createRequestKey(value: unknown) {
    return JSON.stringify(normalizeForRequestKey(value));
}
