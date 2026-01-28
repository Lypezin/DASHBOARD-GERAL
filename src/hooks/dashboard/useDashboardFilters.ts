import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filters } from '@/types';
import { parseArrayParam, parseNumberParam, parseNumberArrayParam } from '@/utils/urlParsers';

interface UseDashboardFiltersOptions {
    anosDisponiveis?: number[];
    setAnoEvolucao?: (ano: number) => void;
}

export function useDashboardFilters({ anosDisponiveis, setAnoEvolucao }: UseDashboardFiltersOptions = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Inicializar estado a partir da URL
    const getInitialFilters = (): Filters => {
        const currentYear = new Date().getFullYear();

        // Se temos searchParams, tentamos ler deles
        if (searchParams.size > 0) {
            return {
                ano: parseNumberParam(searchParams.get('ano')) ?? currentYear,
                semana: parseNumberParam(searchParams.get('semana')),
                praca: searchParams.get('praca'),
                subPraca: searchParams.get('subPraca'),
                origem: searchParams.get('origem'),
                turno: searchParams.get('turno'),
                subPracas: parseArrayParam(searchParams.get('subPracas')),
                origens: parseArrayParam(searchParams.get('origens')),
                turnos: parseArrayParam(searchParams.get('turnos')),
                semanas: parseNumberArrayParam(searchParams.get('semanas')),
                filtroModo: (searchParams.get('filtroModo') as 'ano_semana' | 'intervalo') || 'ano_semana',
                dataInicial: searchParams.get('dataInicial'),
                dataFinal: searchParams.get('dataFinal'),
            };
        }

        // Default values
        return {
            ano: currentYear,
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
        };
    };

    const [filters, setFilters] = useState<Filters>(getInitialFilters);

    const filtersProtectedRef = useRef(false);
    const filtersInitializedRef = useRef(false);

    // Sincronizar URL quando filtros mudam
    useEffect(() => {
        if (!filtersInitializedRef.current) {
            filtersInitializedRef.current = true;
            return;
        }

        const params = new URLSearchParams(searchParams.toString());

        // Helper para setar ou remover param
        const updateParam = (key: string, value: string | null | undefined) => {
            if (value) params.set(key, value);
            else params.delete(key);
        };

        updateParam('ano', filters.ano ? String(filters.ano) : null);
        updateParam('semana', filters.semana ? String(filters.semana) : null);
        updateParam('praca', filters.praca);
        updateParam('subPraca', filters.subPraca);
        updateParam('origem', filters.origem);
        updateParam('turno', filters.turno);

        updateParam('subPracas', filters.subPracas.length > 0 ? filters.subPracas.join(',') : null);
        updateParam('origens', filters.origens.length > 0 ? filters.origens.join(',') : null);
        updateParam('turnos', filters.turnos.length > 0 ? filters.turnos.join(',') : null);
        updateParam('semanas', filters.semanas.length > 0 ? filters.semanas.join(',') : null);

        if (filters.filtroModo !== 'ano_semana') params.set('filtroModo', filters.filtroModo);
        else params.delete('filtroModo');

        updateParam('dataInicial', filters.dataInicial);
        updateParam('dataFinal', filters.dataFinal);

        // 'tab' e outros params (como 'comp_semanas') são preservados automaticamente
        // pois iniciamos com searchParams.toString()

        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // Usar replace para não poluir o histórico com cada mudança pequena
        router.replace(url, { scroll: false });

    }, [filters, pathname, router, searchParams]);

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
