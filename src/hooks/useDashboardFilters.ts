import { useState, useCallback, useRef } from 'react';
import { Filters } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardFiltersOptions {
    anosDisponiveis?: number[];
    setAnoEvolucao?: (ano: number) => void;
}

export function useDashboardFilters({ anosDisponiveis, setAnoEvolucao }: UseDashboardFiltersOptions = {}) {
    const [filters, setFilters] = useState<Filters>({
        ano: new Date().getFullYear(),
        semana: null,
        praca: null,
        subPraca: null,
        origem: null,
        turno: null,
        subPracas: [],
        origens: [],
        turnos: [],
        semanas: [],
        filtroModo: 'ano_semana',
        dataInicial: null,
        dataFinal: null,
    });

    const filtersProtectedRef = useRef(false);
    const filtersInitializedRef = useRef(false);

    const setFiltersProtected = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
        const isFunction = typeof newFilters === 'function';

        if (isFunction) {
            const updater = newFilters as (prev: Filters) => Filters;
            setFilters((prev) => {
                const updated = updater(prev);

                if (filtersProtectedRef.current) {
                    const wouldResetAno = prev.ano !== null && updated.ano === null;
                    const wouldResetSemana = prev.semana !== null && updated.semana === null;

                    if (wouldResetAno || wouldResetSemana) {
                        return {
                            ...updated,
                            ano: wouldResetAno ? prev.ano : updated.ano,
                            semana: wouldResetSemana ? prev.semana : updated.semana,
                        };
                    }
                }
                return updated;
            });
        } else {
            const filtersObj = newFilters as Filters;
            if (filtersProtectedRef.current) {
                const currentAno = filters.ano;
                const currentSemana = filters.semana;
                const wouldResetAno = currentAno !== null && filtersObj.ano === null;
                const wouldResetSemana = currentSemana !== null && filtersObj.semana === null;

                if (wouldResetAno || wouldResetSemana) {
                    const protectedFilters: Filters = {
                        ...filtersObj,
                        ano: wouldResetAno ? currentAno : filtersObj.ano,
                        semana: wouldResetSemana ? currentSemana : filtersObj.semana,
                    };
                    setFilters(protectedFilters);
                    return;
                }
            }
            setFilters(filtersObj);
        }
    }, [filters]);

    return {
        filters,
        setFilters: setFiltersProtected,
        filtersProtectedRef,
        filtersInitializedRef
    };
}
