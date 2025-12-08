import { FilterPayload, ValidatedFilterPayload } from '@/types/filters';

export function validateDateFilters(payload: FilterPayload): Partial<ValidatedFilterPayload> {
    const validated: Partial<ValidatedFilterPayload> = {};

    // Validar ano
    if (payload.p_ano !== undefined && payload.p_ano !== null) {
        const ano = parseInt(String(payload.p_ano), 10);
        if (isNaN(ano) || ano < 2000 || ano > 2100) {
            throw new Error('Ano inválido. Deve estar entre 2000 e 2100.');
        }
        validated.p_ano = ano;
    }

    // Validar semana
    if (payload.p_semana !== undefined && payload.p_semana !== null) {
        const semana = parseInt(String(payload.p_semana), 10);
        if (isNaN(semana) || semana < 1 || semana > 53) {
            throw new Error('Semana inválida. Deve estar entre 1 e 53.');
        }
        validated.p_semana = semana;
    }

    // Validar data inicial
    if (payload.p_data_inicial !== undefined && payload.p_data_inicial !== null) {
        const dataInicial = String(payload.p_data_inicial).trim();
        if (dataInicial !== '') {
            validateDateString(dataInicial, 'Data inicial');
            const data = new Date(dataInicial);
            validateDateRange(data, 'Data inicial');
            validated.p_data_inicial = dataInicial;
        }
    }

    // Validar data final
    if (payload.p_data_final !== undefined && payload.p_data_final !== null) {
        const dataFinal = String(payload.p_data_final).trim();
        if (dataFinal !== '') {
            validateDateString(dataFinal, 'Data final');
            const data = new Date(dataFinal);
            validateDateRange(data, 'Data final');

            // Validar que data final >= data inicial
            if (validated.p_data_inicial) {
                const dataIni = new Date(validated.p_data_inicial);
                if (data < dataIni) {
                    throw new Error('Data final deve ser maior ou igual à data inicial.');
                }
            }

            validated.p_data_final = dataFinal;
        }
    }

    // Normalização de datas (se apenas uma foi fornecida)
    if (validated.p_data_inicial && !validated.p_data_final) {
        validated.p_data_final = validated.p_data_inicial;
    }
    if (validated.p_data_final && !validated.p_data_inicial) {
        validated.p_data_inicial = validated.p_data_final;
    }

    return validated;
}

function validateDateString(dateStr: string, label: string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
        throw new Error(`${label} inválida. Use o formato YYYY-MM-DD.`);
    }
    const data = new Date(dateStr);
    if (isNaN(data.getTime())) {
        throw new Error(`${label} inválida.`);
    }
}

function validateDateRange(date: Date, label: string) {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const dataMinima = new Date('2020-01-01');

    if (date > hoje) {
        throw new Error(`${label} não pode ser futura.`);
    }

    if (date < dataMinima) {
        throw new Error(`${label} não pode ser anterior a 2020-01-01.`);
    }
}
