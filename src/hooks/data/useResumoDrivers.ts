/** Hook dedicado para buscar dados do resumo semanal com filtro local de praca */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { mergeDriversAndPedidosData, DriversData, PedidosData } from '@/utils/data/driverTransformers';

interface UseResumoLocalDataOptions {
    ano: number;
    pracas: string[];
    activeTab: string;
}

export function useResumoLocalData({ ano, pracas, activeTab }: UseResumoLocalDataOptions) {
    const [driversData, setDriversData] = useState<DriversData[]>([]);
    const [pedidosData, setPedidosData] = useState<PedidosData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { organization, isLoading: isOrgLoading } = useOrganization();
    const pracasKey = useMemo(() => pracas.join('|'), [pracas]);
    const selectedPracas = useMemo(() => pracasKey ? pracasKey.split('|') : [], [pracasKey]);

    useEffect(() => {
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

                const [driversResult, pedidosResult] = await Promise.all([
                    supabase.rpc('resumo_semanal_drivers', params),
                    supabase.rpc('resumo_semanal_pedidos', params)
                ]);

                if (!mounted) return;

                if (driversResult.error) {
                    safeLog.error('[useResumoLocalData] Drivers RPC error:', driversResult.error);
                }
                if (pedidosResult.error) {
                    safeLog.error('[useResumoLocalData] Pedidos RPC error:', pedidosResult.error);
                }

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoLocalData] Drivers data:', driversResult.data);
                    safeLog.info('[useResumoLocalData] Pedidos data:', pedidosResult.data);
                }

                setDriversData(driversResult.data || []);
                setPedidosData(pedidosResult.data || []);
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
    }, [activeTab, ano, isOrgLoading, organization?.id, selectedPracas]);

    const dataMap = useMemo(() => {
        return mergeDriversAndPedidosData(driversData, pedidosData);
    }, [driversData, pedidosData]);

    return {
        dataMap,
        loading,
        error
    };
}
