/**
 * Valida se um valor é um número inteiro válido dentro de um range
 */
export function validateInteger(
    value: unknown,
    min: number,
    max: number,
    fieldName: string = 'Valor'
): number {
    const num = parseInt(String(value), 10);
    if (isNaN(num)) {
        throw new Error(`${fieldName} deve ser um número.`);
    }
    if (num < min || num > max) {
        throw new Error(`${fieldName} deve estar entre ${min} e ${max}.`);
    }
    return num;
}

/**
 * Valida e sanitiza string
 */
export function validateString(
    value: unknown,
    maxLength: number = 1000,
    fieldName: string = 'Campo',
    allowEmpty: boolean = false
): string {
    if (value === null || value === undefined) {
        if (allowEmpty) return '';
        throw new Error(`${fieldName} é obrigatório.`);
    }

    const str = String(value).trim();

    if (!allowEmpty && str.length === 0) {
        throw new Error(`${fieldName} não pode estar vazio.`);
    }

    if (str.length > maxLength) {
        throw new Error(`${fieldName} não pode ter mais de ${maxLength} caracteres.`);
    }

    return str;
}
