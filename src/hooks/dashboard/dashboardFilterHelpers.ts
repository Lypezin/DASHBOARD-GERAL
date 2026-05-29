import { Filters } from '@/types';
import { parseArrayParam, parseNumberParam, parseNumberArrayParam } from '@/utils/urlParsers';

export function getInitialFiltersFromUrl(searchParams: URLSearchParams): Filters {
    const currentYear = new Date().getFullYear();

    if (searchParams.size > 0) {
        const anoParam = searchParams.get('ano');
        const isAllYears = anoParam === 'todos';

        return {
            ano: isAllYears ? null : parseNumberParam(anoParam) ?? currentYear,
            semana: isAllYears ? null : parseNumberParam(searchParams.get('semana')),
            praca: searchParams.get('praca'),
            subPraca: searchParams.get('subPraca'),
            origem: searchParams.get('origem'),
            turno: searchParams.get('turno'),
            subPracas: parseArrayParam(searchParams.get('subPracas')),
            origens: parseArrayParam(searchParams.get('origens')),
            turnos: parseArrayParam(searchParams.get('turnos')),
            semanas: isAllYears ? [] : parseNumberArrayParam(searchParams.get('semanas')),
            filtroModo: (searchParams.get('filtroModo') as 'ano_semana' | 'intervalo') || 'ano_semana',
            dataInicial: searchParams.get('dataInicial'),
            dataFinal: searchParams.get('dataFinal'),
        };
    }

    return {
        ano: currentYear, semana: null, praca: null, subPraca: null,
        origem: null, turno: null, subPracas: [], origens: [],
        turnos: [], semanas: [], filtroModo: 'ano_semana', dataInicial: null, dataFinal: null,
    };
}

export function buildFilterQueryParams(filters: Filters, currentParams: URLSearchParams): string {
    const params = new URLSearchParams(currentParams.toString());
    const update = (k: string, v: string | null | undefined) => v ? params.set(k, v) : params.delete(k);
    const isAllYears = filters.filtroModo === 'ano_semana' && filters.ano === null;

    if (isAllYears) {
        params.set('ano', 'todos');
    } else {
        update('ano', filters.ano ? String(filters.ano) : null);
    }
    update('semana', !isAllYears && filters.semana ? String(filters.semana) : null);
    update('praca', filters.praca);
    update('subPraca', filters.subPraca);
    update('origem', filters.origem);
    update('turno', filters.turno);
    update('subPracas', filters.subPracas.length > 0 ? filters.subPracas.join(',') : null);
    update('origens', filters.origens.length > 0 ? filters.origens.join(',') : null);
    update('turnos', filters.turnos.length > 0 ? filters.turnos.join(',') : null);
    update('semanas', !isAllYears && filters.semanas.length > 0 ? filters.semanas.join(',') : null);

    if (filters.filtroModo !== 'ano_semana') params.set('filtroModo', filters.filtroModo);
    else params.delete('filtroModo');

    update('dataInicial', filters.dataInicial);
    update('dataFinal', filters.dataFinal);

    return params.toString();
}

export function handleProtectedUpdate(prev: Filters, updated: Filters): Filters {
    const wouldResetAno = prev.ano !== null && updated.ano === null;
    const wouldResetSemana = prev.semana !== null && updated.semana === null;
    if (wouldResetAno || wouldResetSemana) {
        return {
            ...updated,
            ano: wouldResetAno ? prev.ano : updated.ano,
            semana: wouldResetSemana ? prev.semana : updated.semana,
        };
    }
    return updated;
}
