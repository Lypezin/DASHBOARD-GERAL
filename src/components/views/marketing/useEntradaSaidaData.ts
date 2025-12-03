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
            if (!dataInicial || !dataFinal || !organizationId) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data: rpcData, error: rpcError } = await safeRpc<FluxoEntregadores[]>('get_fluxo_entregadores', {
                    p_data_inicial: dataInicial,
                    p_data_final: dataFinal,
                    p_organization_id: organizationId
                }, {
                    timeout: RPC_TIMEOUTS.LONG, // Pode demorar um pouco devido aos cálculos
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
