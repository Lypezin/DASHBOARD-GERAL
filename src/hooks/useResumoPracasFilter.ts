import { useState, useCallback } from 'react';

const STORAGE_KEY = 'resumo_pracas_filter';

// Hook for managing persisted praça filter
export function useResumoPracasFilter() {
    const [selectedPracas, setSelectedPracas] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const setPracas = useCallback((pracas: string[]) => {
        setSelectedPracas(pracas);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pracas));
        } catch {
            // Ignore storage errors
        }
    }, []);

    const togglePraca = useCallback((praca: string) => {
        setSelectedPracas(prev => {
            const newPracas = prev.includes(praca)
                ? prev.filter(p => p !== praca)
                : [...prev, praca];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newPracas));
            } catch {
                // Ignore storage errors
            }
            return newPracas;
        });
    }, []);

    const clearFilter = useCallback(() => {
        setSelectedPracas([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }, []);

    return {
        selectedPracas,
        setPracas,
        togglePraca,
        clearFilter
    };
}
