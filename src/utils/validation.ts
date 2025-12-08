/**
 * Utilitários de validação e verificação de tipos.
 */

export const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};
