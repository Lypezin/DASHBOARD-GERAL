import { useCallback, useEffect, useState } from 'react';
import { MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { AtendenteData } from './AtendenteCard';
import { buildCacheKey, getCachedResultados, fetchResultados, normalizeResultados, TotaisData } from './resultadosFetchers';

export function useResultadosData() {
  const { organization, currentUser, hasResolved } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

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

  const loadData = useCallback(async () => {
    if (!hasResolved) return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = buildCacheKey(organizationId, filters);
      const rows = getCachedResultados(cacheKey) || await fetchResultados(cacheKey, {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        data_custo_inicial: filters.filtroEnviadosLiberados.dataInicial || null,
        data_custo_final: filters.filtroEnviadosLiberados.dataFinal || null,
        p_organization_id: organizationId,
      });

      const normalized = normalizeResultados(rows);
      setAtendentesData(normalized.atendentes);
      setTotais(normalized.totais);
    } catch (err: unknown) {
      safeLog.error('Erro ao buscar dados de Resultados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de Resultados');
    } finally {
      setLoading(false);
    }
  }, [filters, hasResolved, organizationId]);

  useEffect(() => {
    if (!hasResolved) {
      setLoading(true);
      return;
    }

    void loadData();
  }, [hasResolved, loadData]);

  const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados' | 'filtroEnviadosLiberados', filter: MarketingDateFilter) => {
    setFilters((prev) => ({
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
