import { FilterPayload, ValidatedFilterPayload } from '@/types/filters';

export function validateAuxiliaryFilters(payload: FilterPayload): Partial<ValidatedFilterPayload> {
    const validated: Partial<ValidatedFilterPayload> = {};

    // Validar turnos
    if (payload.p_turno) {
        const turnos = parseAndValidateList(
            payload.p_turno,
            'Turno',
            /^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/
        );
        validated.p_turno = turnos.join(',');
    }

    // Validar arrays de turnos
    if (payload.p_turnos && Array.isArray(payload.p_turnos) && payload.p_turnos.length > 0) {
        validated.p_turnos = sanitizeStringArray(payload.p_turnos);
    }

    // Validar limite
    if (payload.p_limite_semanas !== undefined && payload.p_limite_semanas !== null) {
        const limite = parseInt(String(payload.p_limite_semanas), 10);
        if (isNaN(limite) || limite < 1 || limite > 100) {
            throw new Error('Limite inválido. Deve estar entre 1 e 100.');
        }
        validated.p_limite_semanas = limite;
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
        throw new Error(`Máximo de 50 ${label.toLowerCase()}s permitidos.`);
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
