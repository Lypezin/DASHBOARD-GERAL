import { CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/helpers';

export interface WeekInfo {
    semanaNumero: number;
    anoNumero: number;
}

export function parseWeekString(semana: string | number, defaultYear?: number): WeekInfo {
    let semanaNumero: number;
    let anoNumero: number;

    if (typeof semana === 'string') {
        if (semana.includes('W')) {
            const anoMatch = semana.match(/(\d{4})/);
            const semanaMatch = semana.match(/W(\d+)/);
            // Se tiver ano na string (ex: "2024-W01"), usa ele. Senão usa o anoSelecionado ou o atual.
            anoNumero = anoMatch ? parseInt(anoMatch[1], 10) : (defaultYear || new Date().getFullYear());
            semanaNumero = semanaMatch ? parseInt(semanaMatch[1], 10) : parseInt(semana, 10);
        } else {
            semanaNumero = parseInt(semana, 10);
            anoNumero = defaultYear || new Date().getFullYear();
        }
    } else {
        semanaNumero = semana;
        anoNumero = defaultYear || new Date().getFullYear();
    }

    return { semanaNumero, anoNumero };
}

export function createComparisonFilter(
    semana: string | number,
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null,
    organizationId: string | null,
    selectedYear?: number
) {
    const { semanaNumero, anoNumero } = parseWeekString(semana, selectedYear);

    const filters = {
        ano: anoNumero,
        semana: semanaNumero,
        semanas: [],
        praca: pracaSelecionada,
        subPraca: null,
        origem: null,
        turno: null,
        subPracas: [],
        origens: [],
        turnos: [],
        filtroModo: 'ano_semana' as const,
        dataInicial: null,
        dataFinal: null,
    };

    return buildFilterPayload(filters, currentUser, organizationId);
}
