import { readJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

export const STORAGE_KEY = 'mkt_entrada_saida_filters';

export interface FilterState {
    dataInicial: string;
    dataFinal: string;
    praca: string | null;
}

export function getDefaultFilters(): FilterState {
    const today = new Date();
    return {
        dataInicial: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        dataFinal: today.toISOString().split('T')[0],
        praca: null
    };
}

export function loadPersistedFilters(): FilterState | null {
    const parsed = readJsonStorage<FilterState | null>(
        typeof window !== 'undefined' ? sessionStorage : undefined,
        STORAGE_KEY,
        null
    );

    if (parsed?.dataInicial && parsed.dataFinal) {
        return parsed;
    }

    return null;
}

export function persistFilters(filters: FilterState) {
    writeJsonStorage(typeof window !== 'undefined' ? sessionStorage : undefined, STORAGE_KEY, filters);
}
