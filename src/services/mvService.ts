import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import type {
    RefreshMVResult,
    PendingMV,
    RetryFailedMVsResult,
} from '@/types/upload';

export const mvService = {
    async refreshSingleMV(mvName: string) {
        return await safeRpc<RefreshMVResult>(
            'refresh_single_mv_with_progress',
            { mv_name_param: mvName },
            {
                timeout: 300000, // 5 minutos por MV
                validateParams: false
            }
        );
    },

    async getPendingMVs() {
        return await safeRpc<PendingMV[]>(
            'get_pending_mvs',
            {},
            {
                timeout: 30000,
                validateParams: false
            }
        );
    },

    async retryFailedMVs(mvNames: string[]) {
        return await safeRpc<RetryFailedMVsResult>(
            'retry_failed_mvs',
            { mv_names: mvNames },
            {
                timeout: 600000, // 10 minutos
                validateParams: false
            }
        );
    },

    processRefreshResult(
        refreshData: RefreshMVResult | null,
        refreshError: any,
        mvName: string
    ): { success: boolean; message: string; isTimeout: boolean } {
        if (refreshError) {
            const errorCode = refreshError?.code;
            const errorMessage = String(refreshError?.message || '');
            const isTimeout =
                errorCode === 'TIMEOUT' ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('demorou muito');

            if (isTimeout) {
                safeLog.warn(
                    `Timeout ao atualizar ${mvName}(verificando se foi atualizada mesmo assim)`
                );
                return { success: false, message: 'Timeout', isTimeout: true };
            } else {
                safeLog.error(`Erro ao atualizar ${mvName}: `, refreshError);
                return { success: false, message: errorMessage, isTimeout: false };
            }
        } else if (refreshData) {
            // A função RPC retorna o resultado dentro de uma propriedade com o nome da função
            const result = (refreshData as unknown as { refresh_single_mv_with_progress?: RefreshMVResult })
                ?.refresh_single_mv_with_progress || refreshData;

            const success = result?.success === true;
            const viewName = result?.view || mvName;
            const duration = result?.duration_seconds;
            const method = result?.method;
            const warning = result?.warning;
            const error = result?.error;

            // Se success = true OU se tem warning de fallback (que significa que funcionou), considerar sucesso
            const isSuccess =
                success ||
                (warning && (warning.includes('fallback') || warning.includes('CONCURRENTLY falhou')));

            if (isSuccess) {
                const durationStr = duration ? `${duration.toFixed(1)}s` : 'N/A';
                const methodStr = method || (warning ? 'FALLBACK' : 'NORMAL');
                safeLog.info(`✅ ${viewName} atualizada em ${durationStr}(${methodStr})`);
                return { success: true, message: `Atualizada em ${durationStr}`, isTimeout: false };
            } else {
                const errorMsg = error || 'Erro desconhecido';
                safeLog.warn(`Falha ao atualizar ${mvName}: ${errorMsg}`);
                return { success: false, message: errorMsg, isTimeout: false };
            }
        } else {
            safeLog.warn(`Resposta vazia ao atualizar ${mvName}`);
            return { success: false, message: 'Resposta vazia', isTimeout: false };
        }
    }
};
