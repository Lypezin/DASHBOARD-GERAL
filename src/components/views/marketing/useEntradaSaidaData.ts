import { useState, useEffect } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { safeLog } from '@/lib/errorHandler';

interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    saldo: number;
    nomes_entradas: string[];
    nomes_saidas: string[];
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

            try {
                // Use function with date parameters (matches working functions pattern)
                const { data: rpcData, error: rpcError } = await safeRpc<FluxoEntregadores[]>('get_fluxo_semanal', {
                    p_data_inicial: start,
                    p_data_final: end,
                    p_organization_id: organizationId
                }, {
                    timeout: RPC_TIMEOUTS.LONG,
                    validateParams: true
                });

                if (rpcError) throw rpcError;

                // Parse result - JSON function returns the array directly
                const parsedData = Array.isArray(rpcData) ? rpcData : (rpcData || []);
                setData(parsedData);
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
