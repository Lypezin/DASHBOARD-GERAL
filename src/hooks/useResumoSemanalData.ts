/**
 * Hook dedicado para buscar dados do resumo semanal
 * Usa o RPC V2 que contém total_drivers e total_slots
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AderenciaSemanalV2 {
    semana: string;
    horas_a_entregar?: string;
    horas_entregues?: string;
    segundos_planejados?: number;
    segundos_realizados?: number;
    aderencia_percentual: number;
    total_drivers?: number;
    total_slots?: number;
}

interface UseResumoSemanalDataOptions {
    filterPayload: FilterPayload;
    activeTab: string;
}

export function useResumoSemanalData({ filterPayload, activeTab }: UseResumoSemanalDataOptions) {
    const [aderenciaSemanalV2, setAderenciaSemanalV2] = useState<AderenciaSemanalV2[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { isLoading: isOrgLoading } = useOrganization();

    useEffect(() => {
        if (isOrgLoading) return;

        // Só buscar se a tab ativa for 'resumo'
        if (activeTab !== 'resumo') return;

        let mounted = true;

        const fetchResumoData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    p_ano: filterPayload.p_ano,
                    p_organization_id: filterPayload.p_organization_id,
                    p_praca: filterPayload.p_praca,
                    p_sub_praca: filterPayload.p_sub_praca,
                    p_origem: filterPayload.p_origem,
                    p_turno: filterPayload.p_turno,
                    p_sub_pracas: filterPayload.p_sub_pracas,
                    p_origens: filterPayload.p_origens,
                    p_turnos: filterPayload.p_turnos,
                };

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoSemanalData] Buscando dados V2 para resumo:', params);
                }

                const { data, error: rpcError } = await supabase.rpc('dashboard_resumo_v2', params);

                if (!mounted) return;

                if (rpcError) {
                    safeLog.error('[useResumoSemanalData] Erro ao buscar resumo V2:', rpcError);
                    setError(new Error(rpcError.message));
                    setLoading(false);
                    return;
                }

                // Extrair aderencia_semanal do resultado
                const rawData = Array.isArray(data) ? data[0] : data;
                const aderenciaSemanal = rawData?.aderencia_semanal || [];

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info('[useResumoSemanalData] Dados V2 recebidos:', {
                        totalWeeks: aderenciaSemanal.length,
                        sample: aderenciaSemanal[0]
                    });
                }

                setAderenciaSemanalV2(aderenciaSemanal);

            } catch (err: any) {
                if (mounted) {
                    safeLog.error('[useResumoSemanalData] Erro:', err);
                    setError(err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResumoData, DELAYS.DEBOUNCE);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [
        activeTab,
        isOrgLoading,
        JSON.stringify(filterPayload)
    ]);

    return {
        aderenciaSemanalV2,
        loading,
        error
    };
}
