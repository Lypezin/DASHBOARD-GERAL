import { useState, useEffect, useRef, useCallback } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { useAuth } from '@/hooks/useAuth';

export interface MarketingComparisonData {
    semana_iso: string;
    // Hours
    segundos_ops: number;
    segundos_mkt: number;
    // Offered
    ofertadas_ops: number;
    ofertadas_mkt: number;
    // Accepted
    aceitas_ops: number;
    aceitas_mkt: number;
    // Completed
    concluidas_ops: number;
    concluidas_mkt: number;
    // Rejected
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
    // Values (taxas)
    valor_ops: number;
    valor_mkt: number;
    // Drivers (entregadores)
    entregadores_ops: number;
    entregadores_mkt: number;
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

    // Ref to track the current active request ID
    const requestIdRef = useRef(0);

    const fetchData = useCallback(async () => {
        if (!dataInicial || !dataFinal || !organizationId) return;

        // Increment request ID to invalidate previous requests
        const currentRequestId = ++requestIdRef.current;

        try {
            setLoading(true);
            setError(null);

            const params = {
                data_inicial: dataInicial,
                data_final: dataFinal,
                p_organization_id: organizationId,
                p_praca: praca
            };

            const { data: result, error: rpcError } = await safeRpc<MarketingComparisonData[]>(
                'get_marketing_comparison_weekly',
                params,
                { validateParams: false, timeout: 60000 }
            );

            // Check if this is still the active request
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            if (rpcError) {
                // Ignore query_canceled (57014) errors as they are expected when cancelling
                if (rpcError.code === '57014' || rpcError.message?.includes('57014')) {
                    console.warn('Ignored cancelled request', rpcError);
                    return;
                }
                console.error('RPC Error:', rpcError);
                throw rpcError;
            }

            setData(result || []);

        } catch (err: any) {
            // Check if this is still the active request
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            safeLog.error('Erro ao buscar comparação marketing:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [dataInicial, dataFinal, organizationId, praca]);

    useEffect(() => {
        fetchData();

        // Cleanup function to invalidate current request on unmount or deps change
        return () => {
            // We don't actively abort the fetch since safeRpc doesn't return an abort controller,
            // but the requestId check will prevent state updates.
            requestIdRef.current++;
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
