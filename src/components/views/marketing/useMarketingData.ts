import { useCallback, useEffect, useState } from 'react';
import { MarketingCityData, MarketingFilters, MarketingTotals } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { fetchMarketingTotalsData, fetchMarketingCitiesData } from '@/utils/marketingDataFetcher';

export function useMarketingData() {
  const { organization, currentUser, hasResolved } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<MarketingTotals>({
    criado: 0,
    enviado: 0,
    liberado: 0,
    rodandoInicio: 0,
    aberto: 0,
    voltou: 0
  });
  const [citiesData, setCitiesData] = useState<MarketingCityData[]>([]);
  const [filters, setFilters] = useState<MarketingFilters>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroRodouDia: { dataInicial: null, dataFinal: null },
    filtroDataInicio: { dataInicial: null, dataFinal: null },
    praca: null,
  });

  const refreshData = useCallback(async () => {
    if (!hasResolved) return;

    setLoading(true);
    setError(null);

    try {
      const [nextTotals, nextCities] = await Promise.all([
        fetchMarketingTotalsData(filters, organizationId),
        fetchMarketingCitiesData(filters, organizationId)
      ]);

      setTotals(nextTotals);
      setCitiesData(nextCities);
    } catch (err: unknown) {
      safeLog.error('Erro buscar dados Marketing:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filters, hasResolved, organizationId]);

  useEffect(() => {
    if (!hasResolved) {
      setLoading(true);
      return;
    }

    void refreshData();
  }, [hasResolved, refreshData]);

  const handleFilterChange = (filterName: keyof MarketingFilters, value: MarketingFilters[keyof MarketingFilters]) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  return { loading, error, totals, citiesData, filters, handleFilterChange };
}
