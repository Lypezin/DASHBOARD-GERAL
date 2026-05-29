import { safeLog } from '@/lib/errorHandler';
import type {
    PendingMV,
    RefreshMVResult,
    RetryFailedMVsResult,
} from '@/types/upload';

type ServiceResponse<T> = {
    data: T | null;
    error: { message: string } | null;
};

async function parseRefreshResponse<T>(response: Response): Promise<ServiceResponse<T>> {
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
        return {
            data: null,
            error: { message: payload?.error || `Erro HTTP ${response.status}` }
        };
    }

    return { data: payload as T, error: null };
}

export const mvService = {
    async enqueueRefresh(reason = 'manual', includeSecondary = true, requireAdmin = false) {
        const response = await fetch('/api/mvs/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ reason, includeSecondary, requireAdmin })
        });

        return parseRefreshResponse<{
            success: boolean;
            queued: boolean;
            pending: PendingMV[];
            queue_result?: unknown;
        }>(response);
    },

    async refreshSingleMV(mvName: string): Promise<ServiceResponse<RefreshMVResult>> {
        safeLog.warn(`Refresh direto de ${mvName} foi desabilitado. Usando fila segura.`);
        const { data, error } = await this.enqueueRefresh(`manual:${mvName}`, true, true);

        return {
            data: data
                ? { success: true, view: mvName, reason: 'queued' }
                : null,
            error
        };
    },

    async getPendingMVs(): Promise<ServiceResponse<PendingMV[]>> {
        const response = await fetch('/api/mvs/refresh', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const parsed = await parseRefreshResponse<{ pending: PendingMV[] }>(response);

        return {
            data: parsed.data?.pending || null,
            error: parsed.error
        };
    },

    async retryFailedMVs(mvNames: string[]): Promise<ServiceResponse<RetryFailedMVsResult>> {
        const { data, error } = await this.enqueueRefresh(`retry:${mvNames.length}`, true, true);

        return {
            data: data
                ? {
                    success: true,
                    views_processed: data.pending?.length || 0
                }
                : null,
            error
        };
    },

    processRefreshResult(
        refreshData: RefreshMVResult | null,
        refreshError: any,
        mvName: string
    ): { success: boolean; message: string; isTimeout: boolean } {
        if (refreshError) {
            const errorMessage = String(refreshError?.message || '');
            safeLog.error(`Erro ao enfileirar ${mvName}: `, refreshError);
            return { success: false, message: errorMessage, isTimeout: false };
        }

        if (refreshData?.success) {
            return { success: true, message: 'Enfileirada para atualizacao', isTimeout: false };
        }

        return { success: false, message: 'Resposta vazia', isTimeout: false };
    }
};
