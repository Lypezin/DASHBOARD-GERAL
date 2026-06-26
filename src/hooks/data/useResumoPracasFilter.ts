import { useState, useCallback } from 'react';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const STORAGE_KEY = 'resumo_pracas_filter';

// Hook for managing persisted praça filter
export function useResumoPracasFilter() {
    const [selectedPracas, setSelectedPracas] = useState<string[]>(() => {
        return readJsonStorage<string[]>(
            typeof window !== 'undefined' ? localStorage : undefined,
            STORAGE_KEY,
            []
        );
    });

    const setPracas = useCallback((pracas: string[]) => {
        setSelectedPracas(pracas);
        writeJsonStorage(typeof window !== 'undefined' ? localStorage : undefined, STORAGE_KEY, pracas);
    }, []);

    const togglePraca = useCallback((praca: string) => {
        setSelectedPracas(prev => {
            const newPracas = prev.includes(praca)
                ? prev.filter(p => p !== praca)
                : [...prev, praca];
            writeJsonStorage(typeof window !== 'undefined' ? localStorage : undefined, STORAGE_KEY, newPracas);
            return newPracas;
        });
    }, []);

    const clearFilter = useCallback(() => {
        setSelectedPracas([]);
        removeJsonStorage(typeof window !== 'undefined' ? localStorage : undefined, STORAGE_KEY);
    }, []);

    return {
        selectedPracas,
        setPracas,
        togglePraca,
        clearFilter
    };
}
