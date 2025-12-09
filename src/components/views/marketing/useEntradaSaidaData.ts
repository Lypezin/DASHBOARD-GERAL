import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';

interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    entradas_total: number;
    entradas_marketing: number;
    saidas_novos: number;
    nomes_entradas: string[];
    nomes_saidas: string[];
    nomes_saidas_novos: string[];
    nomes_entradas_marketing: string[];
    nomes_saidas_marketing: string[];
    nomes_saidas_novos_marketing: string[];
    nomes_entradas_operacional: string[];
    nomes_saidas_operacional: string[];
    nomes_saidas_novos_operacional: string[];
}

interface UseEntradaSaidaDataProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export function useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca }: UseEntradaSaidaDataProps) {
    const [data, setData] = useState<FluxoEntregadores[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!organizationId) {
                return;
            }

            // Se não houver datas, usar o ano atual como padrão
            let start = dataInicial;
            let end = dataFinal;

            if (!start || !end) {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), 0, 1);
                start = firstDay.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            }

            setLoading(true);
            setError(null);

            // Mapear nome da praça para o valor do banco
            const dbPraca = praca ? CITY_DB_MAPPING[praca] || praca : null;

            try {
                // Fetch FLUXO (RPC now handles Marketing classification by ID internally)
                const { data: rpcData, error: rpcError } = await safeRpc<any[]>('get_fluxo_semanal', {
                    p_data_inicial: start,
                    p_data_final: end,
                    p_organization_id: organizationId,
                    p_praca: dbPraca
                }, {
                    timeout: RPC_TIMEOUTS.LONG,
                    validateParams: true
                });

                if (rpcError) throw rpcError;

                const rawData = Array.isArray(rpcData) ? rpcData : (rpcData || []);

                const processedData = rawData.map(item => {
                    return {
                        semana: item.semana,

                        entradas_total: Number(item.entradas_total),
                        entradas_marketing: Number(item.entradas_mkt_count),
                        nomes_entradas_marketing: item.nomes_entradas_mkt || [],
                        nomes_entradas_operacional: item.nomes_entradas_ops || [],

                        saidas_total: Number(item.saidas_total),
                        saidas_marketing: Number(item.saidas_mkt_count),
                        nomes_saidas_marketing: item.nomes_saidas_mkt || [],
                        nomes_saidas_operacional: item.nomes_saidas_ops || [],

                        saidas_novos: Number(item.saidas_novos_total),
                        nomes_saidas_novos_marketing: item.nomes_saidas_novos_mkt || [],
                        nomes_saidas_novos_operacional: item.nomes_saidas_novos_ops || [],

                        saldo: Number(item.saldo),

                        // Legacy compatibility (if needed by other components, though we updated Grid)
                        entradas: Number(item.entradas_total),
                        saidas: Number(item.saidas_total),
                        nomes_entradas: [...(item.nomes_entradas_mkt || []), ...(item.nomes_entradas_ops || [])],
                        nomes_saidas: [...(item.nomes_saidas_mkt || []), ...(item.nomes_saidas_ops || [])],
                        nomes_saidas_novos: [...(item.nomes_saidas_novos_mkt || []), ...(item.nomes_saidas_novos_ops || [])]
                    };
                });

                setData(processedData);
            } catch (err: any) {
                safeLog.error('Erro ao buscar fluxo de entregadores:', err);
                setError(err.message || 'Erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [dataInicial, dataFinal, organizationId, praca]);

    return { data, loading, error };
}
