import { Filters } from '@/types';
import { parseArrayParam, parseNumberParam, parseNumberArrayParam } from '@/utils/urlParsers';

function readDimensionValues(searchParams: URLSearchParams, pluralKey: string, singularKey: string) {
    const multipleValues = parseArrayParam(searchParams.get(pluralKey))
        .map((value) => value.trim())
        .filter(Boolean);
    if (multipleValues.length > 0) return Array.from(new Set(multipleValues));

    const legacyValues = parseArrayParam(searchParams.get(singularKey))
        .map((value) => value.trim())
        .filter(Boolean);
    return Array.from(new Set(legacyValues));
}

export function getInitialFiltersFromUrl(searchParams: URLSearchParams): Filters {
    const currentYear = new Date().getFullYear();

    if (searchParams.size > 0) {
        const anoParam = searchParams.get('ano');
        const isAllYears = anoParam === 'todos';
        const subPracas = readDimensionValues(searchParams, 'subPracas', 'subPraca');
        const origens = readDimensionValues(searchParams, 'origens', 'origem');
        const turnos = readDimensionValues(searchParams, 'turnos', 'turno');

        return {
            ano: isAllYears ? null : parseNumberParam(anoParam) ?? currentYear,
            semana: isAllYears ? null : parseNumberParam(searchParams.get('semana')),
            praca: searchParams.get('praca'),
            subPraca: subPracas[0] || null,
            origem: origens[0] || null,
            turno: turnos[0] || null,
            subPracas,
            origens,
            turnos,
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
    const subPracas = filters.subPracas?.length ? filters.subPracas : filters.subPraca ? [filters.subPraca] : [];
    const origens = filters.origens?.length ? filters.origens : filters.origem ? [filters.origem] : [];
    const turnos = filters.turnos?.length ? filters.turnos : filters.turno ? [filters.turno] : [];

    if (isAllYears) {
        params.set('ano', 'todos');
    } else {
        update('ano', filters.ano ? String(filters.ano) : null);
    }
    update('semana', !isAllYears && filters.semana ? String(filters.semana) : null);
    update('praca', filters.praca);
    update('subPraca', subPracas[0] || null);
    update('origem', origens[0] || null);
    update('turno', turnos[0] || null);
    update('subPracas', subPracas.length > 0 ? subPracas.join(',') : null);
    update('origens', origens.length > 0 ? origens.join(',') : null);
    update('turnos', turnos.length > 0 ? turnos.join(',') : null);
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
