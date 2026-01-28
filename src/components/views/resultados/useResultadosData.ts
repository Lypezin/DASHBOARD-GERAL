import { useState, useEffect, useCallback } from 'react';
import { MarketingDateFilter } from '@/types';
// getValoresCidade removed as it is unused and broke build
import { safeLog } from '@/lib/errorHandler';
import { AtendenteData } from './AtendenteCard';
import { useAtendentesData } from '@/hooks/data/useAtendentesData';
import { useCustoPorLiberado } from '@/hooks/data/useCustoPorLiberado';

interface TotaisData {
    totalEnviado: number;
    totalLiberado: number;
}

export function useResultadosData() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [atendentesData, setAtendentesData] = useState<AtendenteData[]>([]);
    const [totais, setTotais] = useState<TotaisData>({
        totalEnviado: 0,
        totalLiberado: 0,
    });
    const [filters, setFilters] = useState<{
        filtroLiberacao: MarketingDateFilter;
        filtroEnviados: MarketingDateFilter;
        filtroEnviadosLiberados: MarketingDateFilter;
    }>({
        filtroLiberacao: { dataInicial: null, dataFinal: null },
        filtroEnviados: { dataInicial: null, dataFinal: null },
        filtroEnviadosLiberados: { dataInicial: null, dataFinal: null },
    });

    const { fetchAtendentesData } = useAtendentesData();
    const { fetchCustoPorLiberado } = useCustoPorLiberado();

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { atendentes, totais: totaisData } = await fetchAtendentesData({
                filtroLiberacao: filters.filtroLiberacao,
                filtroEnviados: filters.filtroEnviados,
            });

            setAtendentesData(atendentes);
            setTotais(totaisData);

            // Buscar custo por liberado após buscar dados dos atendentes
            if (atendentes.length > 0) {
                const atendentesComCusto = await fetchCustoPorLiberado(
                    atendentes,
                    filters.filtroEnviadosLiberados
                );
                setAtendentesData(atendentesComCusto);
            }
        } catch (err: any) {
            safeLog.error('Erro ao buscar dados de Resultados:', err);
            setError(err.message || 'Erro ao carregar dados de Resultados');
        } finally {
            setLoading(false);
        }
    }, [fetchAtendentesData, fetchCustoPorLiberado, filters]);

    // Buscar dados quando os filtros mudarem
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados' | 'filtroEnviadosLiberados', filter: MarketingDateFilter) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: filter,
        }));
    };

    return {
        loading,
        error,
        atendentesData,
        totais,
        filters,
        handleFilterChange
    };
}
