/**
 * Hook dedicado para buscar dados do resumo semanal com filtro local de praça
 * Busca drivers, pedidos e SH filtrados pelas praças selecionadas
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface PedidosData {
    ano: number;
    semana: number;
    total_pedidos: number;
    total_sh: number;
    aderencia_media: number;
}

interface ResumoLocalData {
    ano: number;
    semana: number;
    drivers: number;
    slots: number;
    pedidos: number;
    sh: number;
    aderenciaMedia: number;
}

interface UseResumoLocalDataOptions {
    ano: number;
    pracas: string[];
    activeTab: string;
}

const STORAGE_KEY = 'resumo_pracas_filter';

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

            } catch (err: any) {
                if (mounted) {
                    safeLog.error('[useResumoLocalData] Error:', err);
                    setError(err);
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
        const map = new Map<string, ResumoLocalData>();

        // First add drivers data
        driversData.forEach(d => {
            const key = `${d.ano}-${d.semana}`;
            map.set(key, {
                ano: d.ano,
                semana: d.semana,
                drivers: d.total_drivers,
                slots: d.total_slots,
                pedidos: 0,
                sh: 0,
                aderenciaMedia: 0
            });
        });

        // Then merge pedidos data
        pedidosData.forEach(p => {
            const key = `${p.ano}-${p.semana}`;
            const existing = map.get(key);
            if (existing) {
                existing.pedidos = p.total_pedidos;
                existing.sh = p.total_sh;
                existing.aderenciaMedia = p.aderencia_media || 0;
            } else {
                map.set(key, {
                    ano: p.ano,
                    semana: p.semana,
                    drivers: 0,
                    slots: 0,
                    pedidos: p.total_pedidos,
                    sh: p.total_sh,
                    aderenciaMedia: p.aderencia_media || 0
                });
            }
        });

        return map;
    }, [driversData, pedidosData]);

    return {
        dataMap,
        loading,
        error
    };
}

// Hook for managing persisted praça filter
export function useResumoPracasFilter() {
    const [selectedPracas, setSelectedPracas] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const setPracas = useCallback((pracas: string[]) => {
        setSelectedPracas(pracas);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pracas));
        } catch {
            // Ignore storage errors
        }
    }, []);

    const togglePraca = useCallback((praca: string) => {
        setSelectedPracas(prev => {
            const newPracas = prev.includes(praca)
                ? prev.filter(p => p !== praca)
                : [...prev, praca];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newPracas));
            } catch {
                // Ignore storage errors
            }
            return newPracas;
        });
    }, []);

    const clearFilter = useCallback(() => {
        setSelectedPracas([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }, []);

    return {
        selectedPracas,
        setPracas,
        togglePraca,
        clearFilter
    };
}
