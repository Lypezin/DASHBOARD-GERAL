import { useState, useEffect } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { safeLog } from '@/lib/errorHandler';

interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    saldo: number;
}

interface UseEntradaSaidaDataProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
}

export function useEntradaSaidaData({ dataInicial, dataFinal, organizationId }: UseEntradaSaidaDataProps) {
    const [data, setData] = useState<FluxoEntregadores[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!organizationId) {
                return;
            }

            // Se não houver datas, usar o mês atual como padrão
            let start = dataInicial;
            let end = dataFinal;

            if (!start || !end) {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                // Formato YYYY-MM-DD
                start = firstDay.toISOString().split('T')[0];
                end = lastDay.toISOString().split('T')[0];
            }

            setLoading(true);
            setError(null);

            try {
                const { data: rpcData, error: rpcError } = await safeRpc<FluxoEntregadores[]>('get_fluxo_entregadores', {
                    p_data_inicial: start,
                    p_data_final: end,
                    p_organization_id: organizationId
                }, {
                    timeout: RPC_TIMEOUTS.LONG,
                    validateParams: true
                });

                if (rpcError) throw rpcError;

                setData(rpcData || []);
            } catch (err: any) {
                safeLog.error('Erro ao buscar fluxo de entregadores:', err);
                setError(err.message || 'Erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [dataInicial, dataFinal, organizationId]);

    return { data, loading, error };
}
