import { useState, useEffect, useCallback, useMemo } from 'react';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { fetchEntregadores, fetchEntregadoresFallback } from './EntregadoresDataFetcher';

export function useEntregadoresData() {
    const [entregadores, setEntregadores] = useState<EntregadorMarketing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<keyof EntregadorMarketing | 'rodando'>('total_completadas');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filtroRodouDia, setFiltroRodouDia] = useState<MarketingDateFilter>({
        dataInicial: null,
        dataFinal: null,
    });
    const [filtroDataInicio, setFiltroDataInicio] = useState<MarketingDateFilter>({
        dataInicial: null,
        dataFinal: null,
    });
    const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');

    // Debounce para search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

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
        // Este componente é usado apenas no Marketing, sempre buscar dados
        fetchEntregadoresFn();
    }, [fetchEntregadoresFn]);

    const handleSort = useCallback((field: keyof EntregadorMarketing | 'rodando') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    }, [sortField]);

    // Filtrar e ordenar entregadores
    const entregadoresFiltrados = useMemo(() => {
        let filtered = entregadores;

        if (searchTerm.trim()) {
            const termo = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(e =>
                e.nome.toLowerCase().includes(termo) ||
                e.id_entregador.toLowerCase().includes(termo)
            );
        }

        return [...filtered].sort((a, b) => {
            if (sortField === 'rodando') {
                // Usar campo do banco se existir, senão fallback
                const getRodandoValue = (e: EntregadorMarketing) => {
                    if (e.rodando) return e.rodando === 'Sim';
                    return (e.total_completadas || 0) > 30;
                };

                const rodandoA = getRodandoValue(a);
                const rodandoB = getRodandoValue(b);

                if (rodandoA === rodandoB) return 0;

                // Se sortDirection é 'asc', false vem antes de true (NÃO antes de SIM)
                // Se sortDirection é 'desc', true vem antes de false (SIM antes de NÃO)
                const valA = rodandoA ? 1 : 0;
                const valB = rodandoB ? 1 : 0;

                return sortDirection === 'asc' ? valA - valB : valB - valA;
            }

            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            // Tratamento para números e nulos
            const numA = Number(valA) || 0;
            const numB = Number(valB) || 0;

            return sortDirection === 'asc' ? numA - numB : numB - numA;
        });
    }, [entregadores, searchTerm, sortField, sortDirection]);

    // Função para formatar segundos em horas (HH:MM:SS)
    const formatarSegundosParaHoras = useCallback((segundos: number): string => {
        if (!segundos || segundos === 0) return '00:00:00';
        const horas = segundos / 3600;
        return formatarHorasParaHMS(horas);
    }, []);

    // Calcular totais para os cartões
    const totais = useMemo(() => {
        const totalEntregadores = entregadoresFiltrados.length;
        const totalSegundos = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_segundos || 0), 0);
        const totalOfertadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_ofertadas || 0), 0);
        const totalAceitas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_aceitas || 0), 0);
        const totalCompletadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_completadas || 0), 0);
        const totalRejeitadas = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_rejeitadas || 0), 0);

        const totalRodandoSim = entregadoresFiltrados.filter(e => (e.total_completadas || 0) > 30).length;
        const totalRodandoNao = totalEntregadores - totalRodandoSim;

        return {
            totalEntregadores,
            totalSegundos,
            totalOfertadas,
            totalAceitas,
            totalCompletadas,
            totalRejeitadas,
            totalRodandoSim,
            totalRodandoNao,
        };
    }, [entregadoresFiltrados]);

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
