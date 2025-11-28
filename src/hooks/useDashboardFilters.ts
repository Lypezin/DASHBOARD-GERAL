import { useState, useCallback, useRef, useEffect } from 'react';
import { Filters } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardFiltersOptions {
    anosDisponiveis?: number[];
    setAnoEvolucao?: (ano: number) => void;
}

export function useDashboardFilters({ anosDisponiveis, setAnoEvolucao }: UseDashboardFiltersOptions = {}) {
    // Inicializar com o ano atual para evitar tela em branco
    const [filters, setFilters] = useState<Filters>({
        ano: new Date().getFullYear(), // FIX: Inicializar com ano atual
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

    // Wrapper para setFilters que protege ano e semana após inicialização
    const setFiltersProtected = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
        const stackTrace = new Error().stack;

        // Type guard para verificar se é função
        const isFunction = typeof newFilters === 'function';

        if (isFunction) {
            const updater = newFilters as (prev: Filters) => Filters;
            setFilters((prev) => {
                const updated = updater(prev);

                // LOG: Rastrear mudanças nos arrays de filtros
                if (IS_DEV && (prev.subPracas?.length !== updated.subPracas?.length ||
                    prev.origens?.length !== updated.origens?.length ||
                    prev.turnos?.length !== updated.turnos?.length)) {
                    console.log('🔴 [setFiltersProtected] Arrays de filtros mudaram:', {
                        antes: {
                            subPracas: prev.subPracas?.length || 0,
                            origens: prev.origens?.length || 0,
                            turnos: prev.turnos?.length || 0,
                        },
                        depois: {
                            subPracas: updated.subPracas?.length || 0,
                            origens: updated.origens?.length || 0,
                            turnos: updated.turnos?.length || 0,
                        },
                        stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'),
                    });
                }

                // Proteger ano e semana se já foram inicializados
                if (filtersProtectedRef.current) {
                    const wouldResetAno = prev.ano !== null && updated.ano === null;
                    const wouldResetSemana = prev.semana !== null && updated.semana === null;

                    if (wouldResetAno || wouldResetSemana) {
                        if (IS_DEV) {
                            console.warn('🛡️ [DashboardPage] BLOQUEANDO reset de filtros protegidos:', {
                                wouldResetAno,
                                wouldResetSemana,
                                previous: { ano: prev.ano, semana: prev.semana },
                                attempted: { ano: updated.ano, semana: updated.semana },
                                stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n'),
                            });
                        }

                        // Manter valores anteriores de ano e semana
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
            // Proteger ano e semana se já foram inicializados
            const filtersObj = newFilters as Filters;

            // LOG: Rastrear mudanças nos arrays de filtros
            const currentSubPracas = filters.subPracas?.length || 0;
            const currentOrigens = filters.origens?.length || 0;
            const currentTurnos = filters.turnos?.length || 0;
            const newSubPracas = filtersObj.subPracas?.length || 0;
            const newOrigens = filtersObj.origens?.length || 0;
            const newTurnos = filtersObj.turnos?.length || 0;

            if (IS_DEV && (currentSubPracas !== newSubPracas || currentOrigens !== newOrigens || currentTurnos !== newTurnos)) {
                console.log('🔴 [setFiltersProtected] Arrays de filtros mudaram (obj):', {
                    antes: { subPracas: currentSubPracas, origens: currentOrigens, turnos: currentTurnos },
                    depois: { subPracas: newSubPracas, origens: newOrigens, turnos: newTurnos },
                    stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'),
                });
            }

            if (filtersProtectedRef.current) {
                const currentAno = filters.ano;
                const currentSemana = filters.semana;
                const wouldResetAno = currentAno !== null && filtersObj.ano === null;
                const wouldResetSemana = currentSemana !== null && filtersObj.semana === null;

                if (wouldResetAno || wouldResetSemana) {
                    if (IS_DEV) {
                        console.warn('🛡️ [DashboardPage] BLOQUEANDO reset de filtros protegidos:', {
                            wouldResetAno,
                            wouldResetSemana,
                            current: { ano: currentAno, semana: currentSemana },
                            attempted: { ano: filtersObj.ano, semana: filtersObj.semana },
                            stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n'),
                        });
                    }

                    // Manter valores anteriores de ano e semana
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
