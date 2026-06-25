import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { DashboardResumoData } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { transformDashboardData, createEmptyDashboardData } from '@/utils/dashboard/transformers';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { IS_DEV } from '@/constants/environment';


function getSafeErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    if (typeof error === 'string') return error;
    return 'Erro ao carregar dados do dashboard';
}

export function useDashboardDataFetcher({
    onError,
}: {
    onError?: (error: Error | RpcError) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async (currentPayload: FilterPayload) => {
        setLoading(true);
        setError(null);

        try {

            if (IS_DEV) safeLog.info('[useDashboardMainData] Chamando dashboard_resumo com payload:', currentPayload);

            const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', currentPayload, {
                timeout: RPC_TIMEOUTS.DEFAULT,
                validateParams: false
            });

            if (rpcError) {
                const errorMessage = String(rpcError?.message || '');
                if (errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
                    const errorMsg = 'VariÃ¡veis de ambiente do Supabase nÃ£o estÃ£o configuradas.';
                    setError(errorMsg);
                    if (onError) onError(new Error(errorMsg));
                    setLoading(false);
                    return null;
                }
                safeLog.error('Erro ao carregar dashboard_resumo:', rpcError);
                setError(errorMessage || 'Erro ao carregar dados do dashboard');
                if (onError) onError(rpcError);
                setLoading(false);
                return null;
            }

            if (!data) {
                if (IS_DEV) safeLog.warn('[useDashboardMainData] dashboard_resumo retornou null ou undefined');
                setLoading(false);
                return createEmptyDashboardData();
            }

            if (IS_DEV) safeLog.info('[useDashboardMainData] Dados recebidos com sucesso');
            setLoading(false);
            return data;

        } catch (err) {
            const errorMsg = getSafeErrorMessage(err);
            const error = err instanceof Error ? err : new Error(errorMsg);
            safeLog.error('Erro ao carregar dados principais do dashboard:', err);
            setError(errorMsg);
            if (onError) onError(error);
            setLoading(false);
            return null;
        }
    }, [onError]);

    return { fetchDashboardData, loading, error };
}
