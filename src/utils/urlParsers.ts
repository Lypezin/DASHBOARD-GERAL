/**
 * Utilitários para parsing de parâmetros de URL
 * Usado principalmente em hooks de filtros
 */

export const parseArrayParam = (param: string | null): string[] => {
    if (!param) return [];
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
