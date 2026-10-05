/**
 * Utilitários para parsing de parâmetros de URL
 * Usado principalmente em hooks de filtros
 */

export const parseArrayParam = (param: string | null): string[] => {
    if (!param) return [];

    // New links encode selected dimensions as JSON so names containing commas
    // remain a single value. Keep accepting comma-separated links already in use.
    const trimmed = param.trim();
    if (trimmed.startsWith('[')) {
        try {
            const parsed: unknown = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((value): value is string => typeof value === 'string')
                    .filter(Boolean);
            }
        } catch {
            // Fall through to the legacy comma-separated format.
        }
    }

    return param.split(',').filter(Boolean);
};

export const parseNumberParam = (param: string | null): number | null => {
    if (!param) return null;
    const num = Number(param);
    return isNaN(num) ? null : num;
};

export const parseNumberArrayParam = (param: string | null): number[] => {
    if (!param) return [];
    return param.split(',')
        .map(Number)
        .filter(n => !isNaN(n));
};
