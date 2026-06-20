import { useCallback, useEffect, useRef, useState } from 'react';
import { MarketingCityData, MarketingFilters, MarketingTotals } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { fetchMarketingTotalsData, fetchMarketingCitiesData } from '@/utils/marketingDataFetcher';
import { createRequestKey } from '@/utils/request/createRequestKey';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface MarketingDataResult {
  totals: MarketingTotals;
  citiesData: MarketingCityData[];
}

const marketingDataCache = new Map<string, { timestamp: number; data: MarketingDataResult }>();
const marketingDataRequests = new Map<string, Promise<MarketingDataResult>>();

function getCachedMarketingData(cacheKey: string) {
  const cached = marketingDataCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    marketingDataCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchMarketingDataWithDedupe(
  cacheKey: string,
  filters: MarketingFilters,
  organizationId: string | null
) {
  const activeRequest = marketingDataRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const [totals, citiesData] = await Promise.all([
      fetchMarketingTotalsData(filters, organizationId),
      fetchMarketingCitiesData(filters, organizationId)
    ]);
    const result = { totals, citiesData };

    marketingDataCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result,
    });

    return result;
  })().finally(() => {
    marketingDataRequests.delete(cacheKey);
  });

  marketingDataRequests.set(cacheKey, request);
  return request;
}

function createEmptyTotals(): MarketingTotals {
  return {
    criado: 0,
    enviado: 0,
    liberado: 0,
    rodandoInicio: 0,
    aberto: 0,
    voltou: 0,
  };
}

export function useMarketingData() {
  const { organization, currentUser, hasResolved } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<MarketingTotals>(createEmptyTotals);
  const [citiesData, setCitiesData] = useState<MarketingCityData[]>([]);
  const [filters, setFilters] = useState<MarketingFilters>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroRodouDia: { dataInicial: null, dataFinal: null },
    filtroDataInicio: { dataInicial: null, dataFinal: null },
    praca: null,
  });
  const hasVisibleDataRef = useRef(false);

  hasVisibleDataRef.current = citiesData.length > 0 || Object.values(totals).some((value) => Number(value) > 0);

  const refreshData = useCallback(async () => {
    if (!hasResolved) return;

    const cacheKey = createRequestKey({
      organizationId: organizationId || 'global',
      filters,
    });
    const cached = getCachedMarketingData(cacheKey);

    if (cached) {
      setTotals(cached.totals);
      setCitiesData(cached.citiesData);
      setError(null);
      setLoading(false);
      return;
    }

    const hasVisibleData = hasVisibleDataRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextData = await fetchMarketingDataWithDedupe(cacheKey, filters, organizationId);
      setTotals(nextData.totals);
      setCitiesData(nextData.citiesData);
    } catch (err: unknown) {
      safeLog.error('Erro buscar dados Marketing:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      if (!hasVisibleData) {
        setTotals(createEmptyTotals());
        setCitiesData([]);
      }
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
