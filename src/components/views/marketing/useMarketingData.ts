import { useState, useEffect, useCallback } from 'react';
import { MarketingFilters, MarketingTotals, MarketingCityData, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { getCurrentUserOrganizationId } from '@/utils/organizationHelpers';
import { fetchMarketingTotalsData, fetchMarketingCitiesData } from '@/utils/marketingDataFetcher';

export function useMarketingData() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totals, setTotals] = useState<MarketingTotals>({ criado: 0, enviado: 0, liberado: 0, rodandoInicio: 0 });
    const [citiesData, setCitiesData] = useState<MarketingCityData[]>([]);
    const [filters, setFilters] = useState<MarketingFilters>({
        filtroLiberacao: { dataInicial: null, dataFinal: null },
        filtroEnviados: { dataInicial: null, dataFinal: null },
        filtroRodouDia: { dataInicial: null, dataFinal: null },
        filtroDataInicio: { dataInicial: null, dataFinal: null },
    });

    const refreshData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const orgId = await getCurrentUserOrganizationId();
            const [t, c] = await Promise.all([
                fetchMarketingTotalsData(filters, orgId),
                fetchMarketingCitiesData(filters, orgId)
            ]);
            setTotals(t);
            setCitiesData(c);
        } catch (err: any) {
            safeLog.error('Erro buscar dados Marketing:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { refreshData(); }, [refreshData]);

    const handleFilterChange = (filterName: keyof MarketingFilters, filter: MarketingDateFilter) => {
        setFilters(prev => ({ ...prev, [filterName]: filter }));
    };

    return { loading, error, totals, citiesData, filters, handleFilterChange };
}
