import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mkt_entrada_saida_filters';

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

export function useMarketingFilters() {
    const [filters, setFilters] = useState<FilterState>(() => {
        return loadPersistedFilters() || getDefaultFilters();
    });

    const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => {
        return loadPersistedFilters() || getDefaultFilters();
    });

    useEffect(() => {
        if (appliedFilters.dataInicial && appliedFilters.dataFinal) {
            persistFilters(appliedFilters);
        }
    }, [appliedFilters]);

    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        const resetFilters = getDefaultFilters();
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
    }, []);

    const handleQuickFilter = useCallback((type: 'week' | 'month' | 'quarter' | 'year') => {
        const today = new Date();
        let start: Date;

        switch (type) {
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                break;
            }
            case 'year':
            default:
                start = new Date(today.getFullYear(), 0, 1);
                break;
        }

        setFilters(prev => ({
            ...prev,
            dataInicial: start.toISOString().split('T')[0],
            dataFinal: today.toISOString().split('T')[0]
        }));
    }, []);

    return {
        filters,
        setFilters,
        appliedFilters,
        handleApplyFilters,
        handleClearFilters,
        handleQuickFilter
    };
}
