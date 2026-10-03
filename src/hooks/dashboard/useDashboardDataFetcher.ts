import { useCallback, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { DashboardResumoData } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { IS_DEV } from '@/constants/environment';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { parseDashboardResumoResponse } from '@/utils/dashboard/dashboardResumoValidation';

function getSafeErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    if (typeof error === 'string') return error;
    return 'Erro ao carregar dados do dashboard';
}

export function useDashboardDataFetcher({
    onError,
    payloadKey,
}: {
    onError?: (error: Error | RpcError) => void;
    payloadKey: string;
}) {
    const requestIdRef = useRef(0);
    const [loadingState, setLoadingState] = useState<{ key: string; loading: boolean } | null>(null);
    const [errorState, setErrorState] = useState<{ key: string; error: string } | null>(null);

    const fetchDashboardData = useCallback(async (currentPayload: FilterPayload) => {
        const requestKey = payloadKey || createRequestKey(currentPayload);
        const requestId = ++requestIdRef.current;
        const isCurrentRequest = () => requestIdRef.current === requestId;

        setLoadingState({ key: requestKey, loading: true });
        setErrorState((current) => current?.key === requestKey ? null : current);

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
                    if (isCurrentRequest()) {
                        setErrorState({ key: requestKey, error: errorMsg });
                        if (onError) onError(new Error(errorMsg));
                    }
                    return null;
                }
                safeLog.error('Erro ao carregar dashboard_resumo:', rpcError);
                if (isCurrentRequest()) {
                    setErrorState({ key: requestKey, error: errorMessage || 'Erro ao carregar dados do dashboard' });
                    if (onError) onError(rpcError);
                }
                return null;
            }

            const parsedData = parseDashboardResumoResponse(data);
            if (!parsedData) {
                if (IS_DEV) safeLog.warn('[useDashboardMainData] dashboard_resumo retornou null ou undefined');
                throw new Error('A consulta de resumo retornou uma resposta vazia ou em formato inválido.');
            }

            if (IS_DEV) safeLog.info('[useDashboardMainData] Dados recebidos com sucesso');
            return parsedData;

        } catch (err) {
            const errorMsg = getSafeErrorMessage(err);
            const error = err instanceof Error ? err : new Error(errorMsg);
            safeLog.error('Erro ao carregar dados principais do dashboard:', err);
            if (isCurrentRequest()) {
                setErrorState({ key: requestKey, error: errorMsg });
                if (onError) onError(error);
            }
            return null;
        } finally {
            if (isCurrentRequest()) setLoadingState({ key: requestKey, loading: false });
        }
    }, [onError, payloadKey]);

    return {
        fetchDashboardData,
        loading: loadingState?.key === payloadKey && loadingState.loading,
        error: errorState?.key === payloadKey ? errorState.error : null,
    };
}
