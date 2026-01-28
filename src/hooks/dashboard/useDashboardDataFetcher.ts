import { useState, useRef, useMemo } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { DashboardResumoData } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { transformDashboardData, createEmptyDashboardData } from '@/utils/dashboard/transformers';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

const IS_DEV = process.env.NODE_ENV === 'development';

function getSafeErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    if (typeof error === 'string') return error;
    return 'Erro ao carregar dados do dashboard';
}

export function useDashboardDataFetcher({
    filterPayload,
    onError,
}: {
    filterPayload: FilterPayload;
    onError?: (error: Error | RpcError) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async (currentPayload: FilterPayload) => {
        setLoading(true);
        setError(null);

        try {
            // Verificar se o Supabase está disponível
            try {
                const { supabase } = await import('@/lib/supabaseClient');
                if (!supabase || !supabase.rpc) throw new Error('Cliente Supabase não está disponível');
            } catch (supabaseError) {
                console.error('❌ [useDashboardMainData] Erro ao verificar cliente Supabase:', supabaseError);
                const errorMsg = 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.';
                setError(errorMsg);
                if (onError) onError(new Error(errorMsg));
                setLoading(false);
                return null;
            }

            if (IS_DEV) safeLog.info('[useDashboardMainData] Chamando dashboard_resumo com payload:', currentPayload);

            const { data, error: rpcError } = await safeRpc<DashboardResumoData>('dashboard_resumo', currentPayload, {
                timeout: RPC_TIMEOUTS.DEFAULT,
                validateParams: false
            });

            if (rpcError) {
                const errorMessage = String(rpcError?.message || '');
                if (errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
                    const errorMsg = 'Variáveis de ambiente do Supabase não estão configuradas.';
                    setError(errorMsg);
                    if (onError) onError(new Error(errorMsg));
                    setLoading(false);
                    return null;
                }
                safeLog.error('Erro ao carregar dashboard_resumo:', rpcError);
                setLoading(false);
                return createEmptyDashboardData();
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
    };

    return { fetchDashboardData, loading, error };
}
