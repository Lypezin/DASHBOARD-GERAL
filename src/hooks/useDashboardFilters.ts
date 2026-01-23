
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filters } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardFiltersOptions {
    anosDisponiveis?: number[];
    setAnoEvolucao?: (ano: number) => void;
}

// Helper para parsear arrays da URL (ex: subPracas=a,b,c)
const parseArrayParam = (param: string | null): string[] => {
    if (!param) return [];
    return param.split(',').filter(Boolean);
};

// Helper para parsear números da URL
const parseNumberParam = (param: string | null): number | null => {
    if (!param) return null;
    const num = Number(param);
    return isNaN(num) ? null : num;
};

// Helper para parsear arrays de números da URL
const parseNumberArrayParam = (param: string | null): number[] => {
    if (!param) return [];
    return param.split(',')
        .map(Number)
        .filter(n => !isNaN(n));
};

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

        const params = new URLSearchParams();

        if (filters.ano) params.set('ano', String(filters.ano));
        if (filters.semana) params.set('semana', String(filters.semana));
        if (filters.praca) params.set('praca', filters.praca);
        if (filters.subPraca) params.set('subPraca', filters.subPraca);
        if (filters.origem) params.set('origem', filters.origem);
        if (filters.turno) params.set('turno', filters.turno);

        if (filters.subPracas.length > 0) params.set('subPracas', filters.subPracas.join(','));
        if (filters.origens.length > 0) params.set('origens', filters.origens.join(','));
        if (filters.turnos.length > 0) params.set('turnos', filters.turnos.join(','));
        if (filters.semanas.length > 0) params.set('semanas', filters.semanas.join(','));

        if (filters.filtroModo !== 'ano_semana') params.set('filtroModo', filters.filtroModo);
        if (filters.dataInicial) params.set('dataInicial', filters.dataInicial);
        if (filters.dataFinal) params.set('dataFinal', filters.dataFinal);

        // Manter o parâmetro 'tab' se existir
        const currentTab = searchParams.get('tab');
        if (currentTab) params.set('tab', currentTab);

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
