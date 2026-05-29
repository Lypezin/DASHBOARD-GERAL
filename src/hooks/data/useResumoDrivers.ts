/** Hook dedicado para buscar dados do resumo semanal com filtro local de praca */
import { useState, useEffect, useMemo } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { mergeDriversAndPedidosData, DriversData, PedidosData } from '@/utils/data/driverTransformers';
import { fetchDashboardDataApi } from '@/utils/dashboard/fetchDashboardDataApi';

interface UseResumoLocalDataOptions {
    ano: number;
    pracas: string[];
    activeTab: string;
    enabled?: boolean;
}

export function useResumoLocalData({ ano, pracas, activeTab, enabled = true }: UseResumoLocalDataOptions) {
    const [driversData, setDriversData] = useState<DriversData[]>([]);
    const [pedidosData, setPedidosData] = useState<PedidosData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { organization, isLoading: isOrgLoading } = useOrganization();
    const pracasKey = useMemo(() => pracas.join('|'), [pracas]);
    const selectedPracas = useMemo(() => pracasKey ? pracasKey.split('|') : [], [pracasKey]);

    useEffect(() => {
        if (!enabled) {
            setDriversData([]);
            setPedidosData([]);
            setLoading(false);
            setError(null);
            return;
        }

        if (isOrgLoading) return;
        if (!organization?.id) return;
        if (activeTab !== 'resumo') return;

        let mounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    p_ano: ano,
                    p_organization_id: organization.id,
                    p_pracas: selectedPracas.length > 0 ? selectedPracas : null,
                };

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoLocalData] Fetching data:', params);
                }

                const { data, error } = await fetchDashboardDataApi<{
                    drivers: DriversData[];
                    pedidos: PedidosData[];
                }>('resumo_local', params);

                if (!mounted) return;

                if (error) {
                    safeLog.error('[useResumoLocalData] API error:', error);
                    setError(new Error(error.message || 'Erro ao carregar resumo semanal.'));
                    setDriversData([]);
                    setPedidosData([]);
                    return;
                }

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoLocalData] Drivers data:', data?.drivers);
                    safeLog.info('[useResumoLocalData] Pedidos data:', data?.pedidos);
                }

                setDriversData(Array.isArray(data?.drivers) ? data.drivers : []);
                setPedidosData(Array.isArray(data?.pedidos) ? data.pedidos : []);
            } catch (err: unknown) {
                if (!mounted) return;
                safeLog.error('[useResumoLocalData] Error:', err);
                setError(err instanceof Error ? err : new Error('Erro desconhecido'));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchData, DELAYS.DEBOUNCE);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [activeTab, ano, enabled, isOrgLoading, organization?.id, selectedPracas]);

    const dataMap = useMemo(() => {
        return mergeDriversAndPedidosData(driversData, pedidosData);
    }, [driversData, pedidosData]);

    return {
        dataMap,
        loading,
        error
    };
}
