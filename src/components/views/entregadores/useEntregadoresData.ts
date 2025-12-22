import { useState, useEffect, useCallback } from 'react';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { fetchEntregadores } from './EntregadoresDataFetcher';
import { fetchEntregadoresFallback } from './EntregadoresFallbackFetcher';
import { useEntregadoresFilterSort } from './hooks/useEntregadoresFilterSort';
import { useEntregadoresTotals } from './hooks/useEntregadoresTotals';

export function useEntregadoresData() {
    const [entregadores, setEntregadores] = useState<EntregadorMarketing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Filters
    const [filtroRodouDia, setFiltroRodouDia] = useState<MarketingDateFilter>({
        dataInicial: null,
        dataFinal: null,
    });
    const [filtroDataInicio, setFiltroDataInicio] = useState<MarketingDateFilter>({
        dataInicial: null,
        dataFinal: null,
    });
    const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Data Fetching Logic
    const fetchEntregadoresFallbackFn = useCallback(async () => {
        const data = await fetchEntregadoresFallback(filtroDataInicio, filtroRodouDia, cidadeSelecionada, debouncedSearchTerm);
        setEntregadores(data);
        return data;
    }, [filtroDataInicio, filtroRodouDia, cidadeSelecionada, debouncedSearchTerm]);

    const fetchEntregadoresFn = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await fetchEntregadores(
                filtroRodouDia,
                filtroDataInicio,
                cidadeSelecionada,
                fetchEntregadoresFallbackFn,
                debouncedSearchTerm
            );

            setEntregadores(data);
        } catch (err: any) {
            safeLog.error('Erro ao buscar entregadores:', err);
            setError(err.message || 'Erro ao carregar entregadores');
        } finally {
            setLoading(false);
        }
    }, [filtroRodouDia, filtroDataInicio, cidadeSelecionada, fetchEntregadoresFallbackFn, debouncedSearchTerm]);

    useEffect(() => {
        fetchEntregadoresFn();
    }, [fetchEntregadoresFn]);

    // Use extracted hooks for logic
    const {
        sortField,
        sortDirection,
        handleSort,
        entregadoresFiltrados
    } = useEntregadoresFilterSort(entregadores, searchTerm);

    const totais = useEntregadoresTotals(entregadoresFiltrados);

    const formatarSegundosParaHoras = useCallback((segundos: number): string => {
        if (!segundos || segundos === 0) return '00:00:00';
        const horas = segundos / 3600;
        return formatarHorasParaHMS(horas);
    }, []);

    return {
        entregadores,
        entregadoresFiltrados,
        loading,
        error,
        searchTerm,
        sortField,
        sortDirection,
        filtroRodouDia,
        filtroDataInicio,
        cidadeSelecionada,
        totais,
        setSearchTerm,
        setFiltroRodouDia,
        setFiltroDataInicio,
        setCidadeSelecionada,
        handleSort,
        fetchEntregadoresFn,
        formatarSegundosParaHoras,
        setLoading,
        setError
    };
}
