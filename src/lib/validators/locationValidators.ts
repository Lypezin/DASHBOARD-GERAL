import { FilterPayload, ValidatedFilterPayload } from '@/types/filters';

export function validateLocationFilters(payload: FilterPayload): Partial<ValidatedFilterPayload> {
    const validated: Partial<ValidatedFilterPayload> = {};

    // Validar praça
    if (payload.p_praca) {
        const pracas = parseAndValidateList(
            payload.p_praca,
            'Praça',
            /^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/
        );
        validated.p_praca = pracas.length === 1 ? pracas[0] : pracas.join(',');
    }

    // Validar sub-praças
    if (payload.p_sub_praca) {
        const subPracas = parseAndValidateList(
            payload.p_sub_praca,
            'Sub-praça',
            /^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/
        );
        validated.p_sub_praca = subPracas.join(',');
    }

    // Validar origens
    if (payload.p_origem) {
        const origens = parseAndValidateList(
            payload.p_origem,
            'Origem',
            /^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/
        );
        validated.p_origem = origens.join(',');
    }

    // Validar arrays de sub-praças e origens (novos campos)
    if (payload.p_sub_pracas && Array.isArray(payload.p_sub_pracas) && payload.p_sub_pracas.length > 0) {
        validated.p_sub_pracas = sanitizeStringArray(payload.p_sub_pracas);
    }

    if (payload.p_origens && Array.isArray(payload.p_origens) && payload.p_origens.length > 0) {
        validated.p_origens = sanitizeStringArray(payload.p_origens);
    }

    return validated;
}

function parseAndValidateList(
    input: string | string[],
    label: string,
    regex: RegExp
): string[] {
    let list: string[];

    if (Array.isArray(input)) {
        list = input;
    } else if (typeof input === 'string') {
        if (input.includes(',')) {
            list = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else {
            list = [input.trim()];
        }
    } else {
        throw new Error(`${label} deve ser uma string ou array.`);
    }

    if (list.length > 50) {
        throw new Error(`Máximo de 50 ${label.toLowerCase()}s permitidas.`);
    }

    return list
        .slice(0, 50)
        .map(s => {
            const trimmed = s.trim();
            if (trimmed.length === 0 || trimmed.length > 100) {
                throw new Error(`Cada ${label.toLowerCase()} deve ter entre 1 e 100 caracteres.`);
            }
            if (!regex.test(trimmed)) {
                throw new Error(`${label} contém caracteres inválidos.`);
            }
            return trimmed;
        });
}

function sanitizeStringArray(input: unknown[]): string[] {
    return input
        .slice(0, 50)
        .map(s => String(s).trim())
        .filter(s => s.length > 0 && s.length <= 100);
}
