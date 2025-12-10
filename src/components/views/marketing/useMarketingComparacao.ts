import { useState, useEffect, useCallback } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { useAuth } from '@/hooks/useAuth';

export interface MarketingComparisonData {
    semana_iso: string;
    week_start: string;
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    completadas_ops: number;
    completadas_mkt: number;
    // Calculated fields
    horas_ops: number;
    horas_mkt: number;
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

            const { data: result, error: rpcError } = await safeRpc<any[]>('get_marketing_comparison_weekly', params);

            if (rpcError) throw rpcError;

            // Process data (convert seconds to hours for display)
            const processedData = (result || []).map(item => ({
                ...item,
                horas_ops: Math.round((Number(item.segundos_ops) || 0) / 3600),
                horas_mkt: Math.round((Number(item.segundos_mkt) || 0) / 3600),
                ofertadas_ops: Number(item.ofertadas_ops) || 0,
                ofertadas_mkt: Number(item.ofertadas_mkt) || 0
            }));

            setData(processedData);

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
