import { useState, useEffect, useCallback } from 'react';
import { MarketingTotals, MarketingFilters } from '@/types';
import { fetchMarketingTotalsData } from '@/utils/marketingDataFetcher';
import { getCurrentUserOrganizationId } from '@/utils/organizationHelpers';
import { safeLog } from '@/lib/errorHandler';

export function useMarketingApresentacaoData(filters: MarketingFilters) {
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState<MarketingTotals | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const orgId = await getCurrentUserOrganizationId();
            const data = await fetchMarketingTotalsData(filters, orgId);
            setTotals(data);
        } catch (err) {
            safeLog.error('[useMarketingApresentacaoData] Erro ao carregar dados:', err);
            setError('Erro ao carregar dados da apresentação');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { loading, totals, error, reload: loadData };
}
