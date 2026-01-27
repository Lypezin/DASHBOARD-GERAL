/**
 * Hook dedicado para buscar dados de drivers/entregadores por semana
 * para a aba Resumo Semanal
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DriversData {
    ano: number;
    semana: number;
    total_drivers: number;
    total_slots: number;
}

interface UseResumoDriversOptions {
    ano: number;
    pracas: string[];
    activeTab: string;
}

export function useResumoDrivers({ ano, pracas, activeTab }: UseResumoDriversOptions) {
    const [driversData, setDriversData] = useState<DriversData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { organization, isLoading: isOrgLoading } = useOrganization();

    useEffect(() => {
        if (isOrgLoading) return;
        if (!organization?.id) return;
        if (activeTab !== 'resumo') return;

        let mounted = true;

        const fetchDrivers = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    p_ano: ano,
                    p_organization_id: organization.id,
                    p_pracas: pracas.length > 0 ? pracas : null,
                };

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoDrivers] Fetching drivers data:', params);
                }

                const { data, error: rpcError } = await supabase.rpc('resumo_semanal_drivers', params);

                if (!mounted) return;

                if (rpcError) {
                    safeLog.error('[useResumoDrivers] RPC error:', rpcError);
                    setError(new Error(rpcError.message));
                    setLoading(false);
                    return;
                }

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoDrivers] Data received:', data);
                }

                setDriversData(data || []);

            } catch (err: any) {
                if (mounted) {
                    safeLog.error('[useResumoDrivers] Error:', err);
                    setError(err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchDrivers, DELAYS.DEBOUNCE);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [ano, JSON.stringify(pracas), activeTab, isOrgLoading, organization?.id]);

    // Create a map for easy lookup
    const driversMap = useMemo(() => {
        const map = new Map<string, DriversData>();
        driversData.forEach(d => {
            const key = `${d.ano}-${d.semana}`;
            map.set(key, d);
        });
        return map;
    }, [driversData]);

    return {
        driversData,
        driversMap,
        loading,
        error
    };
}
