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
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as FilterState;
            if (parsed.dataInicial && parsed.dataFinal) {
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

export function persistFilters(filters: FilterState) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
        // ignore
    }
}
