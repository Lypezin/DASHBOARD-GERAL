import { useCallback, useEffect, useState } from 'react';
import { MarketingFilters, MarketingTotals } from '@/types';
import { fetchMarketingTotalsData } from '@/utils/marketingDataFetcher';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { safeLog } from '@/lib/errorHandler';

export function useMarketingApresentacaoData(filters: MarketingFilters) {
  const { organization, currentUser, hasResolved } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<MarketingTotals | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!hasResolved) return;

    setLoading(true);
    try {
      const data = await fetchMarketingTotalsData(filters, organizationId);
      setTotals(data);
    } catch (err) {
      safeLog.error('[useMarketingApresentacaoData] Erro ao carregar dados:', err);
      setError('Erro ao carregar dados da apresentação');
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

  return { loading, totals, error, reload: loadData };
}
