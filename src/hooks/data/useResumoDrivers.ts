/** Hook dedicado para buscar dados do resumo semanal com filtro local de praça */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { mergeDriversAndPedidosData, DriversData, PedidosData } from '@/utils/data/driverTransformers';

interface UseResumoLocalDataOptions { ano: number; pracas: string[]; activeTab: string; }

export function useResumoLocalData({ ano, pracas, activeTab }: UseResumoLocalDataOptions) {
    const [driversData, setDriversData] = useState<DriversData[]>([]);
    const [pedidosData, setPedidosData] = useState<PedidosData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { organization, isLoading: isOrgLoading } = useOrganization();

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
                    p_pracas: pracas.length > 0 ? pracas : null,
                };

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoLocalData] Fetching data:', params);
                }

                // Fetch both drivers and pedidos in parallel
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
                if (mounted) {
                    safeLog.error('[useResumoLocalData] Error:', err);
                    setError(err instanceof Error ? err : new Error('Erro desconhecido'));
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchData, DELAYS.DEBOUNCE);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [ano, JSON.stringify(pracas), activeTab, isOrgLoading, organization?.id]);

    // Merge drivers and pedidos data into a single map
    const dataMap = useMemo(() => {
        return mergeDriversAndPedidosData(driversData, pedidosData);
    }, [driversData, pedidosData]);

    return {
        dataMap,
        loading,
        error
    };
}

