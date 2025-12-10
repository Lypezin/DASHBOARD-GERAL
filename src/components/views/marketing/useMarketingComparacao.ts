import { useState, useEffect, useCallback } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { useAuth } from '@/hooks/useAuth';

export interface MarketingComparisonData {
    semana_iso: string;
    segundos_ops: number;
    segundos_mkt: number;
}

export function useMarketingComparacao(
    dataInicial: string,
    dataFinal: string,
    organizationId: string | undefined,
    praca: string | null
) {
    const [data, setData] = useState<MarketingComparisonData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!dataInicial || !dataFinal || !organizationId) return;

        try {
            setLoading(true);
            setError(null);

            const params = {
                data_inicial: dataInicial,
                data_final: dataFinal,
                p_organization_id: organizationId,
                p_praca: praca
            };

            console.log('Calling get_marketing_comparison_weekly with:', params);

            const { data: result, error: rpcError } = await safeRpc<MarketingComparisonData[]>(
                'get_marketing_comparison_weekly',
                params,
                { validateParams: false }
            );

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                throw rpcError;
            }

            console.log('RPC Result:', result);

            setData(result || []);

        } catch (err: any) {
            safeLog.error('Erro ao buscar comparação marketing:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [dataInicial, dataFinal, organizationId, praca]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
