import React, { useCallback, useMemo } from 'react';
import { Filters, FilterOption, CurrentUser, hasFullCityAccess } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useFiltroBar({
    filters,
    setFilters,
    currentUser,
}: {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    currentUser: CurrentUser | null;
}) {
    const handleChange = useCallback((key: keyof Filters, rawValue: string | null) => {
        setFilters((prev) => {
            let processedValue: string | number | null = null;
            if (rawValue && rawValue !== '') {
                if (key === 'ano' || key === 'semana') {
                    processedValue = Number(rawValue);
                } else {
                    processedValue = rawValue;
                }
            }
            return { ...prev, [key]: processedValue };
        });
    }, [setFilters]);

    const handleClearFilters = useCallback(() => {
        setFilters({
            ano: null, semana: null,
            // Marketing tem acesso a todas as cidades, então não precisa restringir
            praca: currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1 ? currentUser.assigned_pracas[0] : null,
            subPraca: null, origem: null, turno: null,
            subPracas: [], origens: [], turnos: [], semanas: [],
            filtroModo: 'ano_semana',
            dataInicial: null,
            dataFinal: null,
        });
    }, [setFilters, currentUser]);

    const handleToggleModo = useCallback(() => {
        if (IS_DEV) {
            safeLog.info('[FiltroBar] handleToggleModo chamado');
        }
        try {
            setFilters((prev) => {
                if (!prev) {
                    if (IS_DEV) {
                        safeLog.warn('[FiltroBar] handleToggleModo: prev é null/undefined');
                    }
                    return prev;
                }
                const novoModo: 'ano_semana' | 'intervalo' = (prev.filtroModo ?? 'ano_semana') === 'ano_semana' ? 'intervalo' : 'ano_semana';
                if (IS_DEV) {
                    safeLog.info('[FiltroBar] Trocando modo:', {
                        modoAtual: prev.filtroModo,
                        novoModo,
                    });
                }
                const newFilters: Filters = {
                    ...prev,
                    filtroModo: novoModo,
                    // Limpar filtros do modo anterior
                    ano: novoModo === 'intervalo' ? null : prev.ano,
                    semana: novoModo === 'intervalo' ? null : prev.semana,
                    semanas: novoModo === 'intervalo' ? [] : prev.semanas ?? [],
                    dataInicial: novoModo === 'ano_semana' ? null : prev.dataInicial ?? null,
                    dataFinal: novoModo === 'ano_semana' ? null : prev.dataFinal ?? null,
                };
                if (IS_DEV) {
                    safeLog.info('[FiltroBar] Novos filters após toggle:', newFilters);
                }
                return newFilters;
            });
        } catch (error) {
            safeLog.error('[FiltroBar] Erro em handleToggleModo:', error);
        }
    }, [setFilters]);

    const hasActiveFilters = useMemo(() => {
        if (!filters) return false;
        if (filters.filtroModo === 'intervalo') {
            return filters.dataInicial !== null || filters.dataFinal !== null || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
                (hasFullCityAccess(currentUser) && filters.praca !== null);
        } else {
            return filters.ano !== null || filters.semana !== null || (filters.semanas && filters.semanas.length > 0) || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
                (hasFullCityAccess(currentUser) && filters.praca !== null);
        }
    }, [filters, currentUser]);

    const shouldDisablePracaFilter = useMemo(() => {
        // Marketing tem acesso a todas as cidades, então não precisa desabilitar o filtro
        return Boolean(currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1);
    }, [currentUser]);

    return {
        handleChange,
        handleClearFilters,
        handleToggleModo,
        hasActiveFilters,
        shouldDisablePracaFilter,
    };
}
