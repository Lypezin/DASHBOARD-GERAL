import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type {
    PendingMV,
    RefreshMVResult,
} from '@/types/upload';

export interface RefreshState {
    isRefreshing: boolean;
    progress: number;
    status: string;
}

export type SetRefreshState = (
    state: RefreshState | ((prev: RefreshState) => RefreshState)
) => void;

interface RefreshPendingOptions {
    timeoutMs?: number;
    maxRounds?: number;
    maxPriority?: number;
    initialProgress?: number;
}

interface PendingRefreshSummary {
    attemptedCount: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    remainingViews: PendingMV[];
}

const MARK_PENDING_TIMEOUT_MS = 30000;
const PENDING_LOOKUP_TIMEOUT_MS = 30000;
const SINGLE_MV_REFRESH_TIMEOUT_MS = 20 * 60 * 1000;
const UPLOAD_REFRESH_MAX_PRIORITY = 80;
const DEFAULT_MAX_REFRESH_ROUNDS = 2;

export const performRefresh = async (
    force: boolean,
    isLowUsage: boolean,
    timeContext: string,
    setRefreshState: SetRefreshState
) => {
    try {
        safeLog.info(`[performRefresh] Iniciando - force=${force}, isLowUsage=${isLowUsage}`);
        setRefreshState(prev => ({ ...prev, progress: 10, status: 'Preparando views...' }));

        safeLog.info('[performRefresh] Passo 1: Chamando refresh_mvs_after_bulk_insert...');
        const bulkResult = await safeRpc('refresh_mvs_after_bulk_insert', { delay_seconds: 5 }, {
            timeout: MARK_PENDING_TIMEOUT_MS,
            validateParams: false
        });
        safeLog.info(
            `[performRefresh] Passo 1 concluido: data=${JSON.stringify(
                bulkResult.data
            )}, error=${JSON.stringify(bulkResult.error)}`
        );

        if (!isLowUsage && !force) {
            safeLog.info('[performRefresh] Refresh adiado - nao e horario de baixo uso e nao foi forcado');
            setRefreshState({ isRefreshing: false, progress: 0, status: '' });
            return;
        }

        safeLog.info(
            `[performRefresh] Passo 2: ${timeContext} - Iniciando refresh ${
                force ? 'imediato pos-upload' : 'automatico pendente'
            }`
        );

        setRefreshState(prev => ({
            ...prev,
            progress: 30,
            status: force
                ? 'Atualizando dados importados...'
                : 'Atualizando views pendentes...'
        }));

        await refreshPendingViewsSequentially(setRefreshState, {
            timeoutMs: SINGLE_MV_REFRESH_TIMEOUT_MS,
            maxRounds: DEFAULT_MAX_REFRESH_ROUNDS,
            maxPriority: force ? UPLOAD_REFRESH_MAX_PRIORITY : undefined,
            initialProgress: 30
        });
    } catch (e) {
        safeLog.warn('Refresh automatico de MVs falhou:', e);
        setRefreshState({
            isRefreshing: false,
            progress: 0,
            status: 'Erro ao atualizar (tentara automaticamente)'
        });
    }
};

const refreshPendingViewsSequentially = async (
    setRefreshState: SetRefreshState,
    options: RefreshPendingOptions = {}
): Promise<PendingRefreshSummary> => {
    const timeoutMs = options.timeoutMs ?? SINGLE_MV_REFRESH_TIMEOUT_MS;
    const maxRounds = options.maxRounds ?? 1;
    const initialProgress = options.initialProgress ?? 60;
    const summary: PendingRefreshSummary = {
        attemptedCount: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        remainingViews: []
    };

    try {
        for (let round = 1; round <= maxRounds; round += 1) {
            const pendingViews = await fetchPendingViews(options.maxPriority);
            summary.remainingViews = pendingViews;

            if (pendingViews.length === 0) {
                safeLog.info('[performRefresh] Nenhuma MV pendente restante');
                break;
            }

            safeLog.info(
                `[performRefresh] Rodada ${round}/${maxRounds}: refresh sequencial de ${pendingViews.length} MVs pendentes`
            );

            let processedCount = 0;

            for (const pendingView of pendingViews) {
                const baseProgress = initialProgress + Math.round((processedCount / pendingViews.length) * 65);
                setRefreshState(prev => ({
                    ...prev,
                    progress: Math.min(baseProgress, 95),
                    status: `Atualizando ${pendingView.mv_name}...`
                }));

                summary.attemptedCount += 1;
                const { data: result, error: refreshError } = await safeRpc<RefreshMVResult>(
                    'refresh_single_mv',
                    { mv_name_param: pendingView.mv_name, force_normal: false },
                    {
                        timeout: timeoutMs,
                        validateParams: false
                    }
                );

                if (refreshError) {
                    summary.failedCount += 1;
                    safeLog.warn(
                        `[performRefresh] Falha ao atualizar ${pendingView.mv_name}:`,
                        refreshError
                    );
                } else if (result?.skipped) {
                    summary.skippedCount += 1;
                    safeLog.warn(
                        `[performRefresh] ${pendingView.mv_name} foi pulada: ${result.reason || 'refresh em andamento'}`
                    );
                    break;
                } else if (result?.success) {
                    summary.successCount += 1;
                    safeLog.info(`[performRefresh] ${pendingView.mv_name} concluida:`, result);
                } else {
                    summary.failedCount += 1;
                    safeLog.warn(`[performRefresh] ${pendingView.mv_name} retornou falha:`, result);
                }

                processedCount += 1;
            }

            const nextPendingViews = await fetchPendingViews(options.maxPriority);
            summary.remainingViews = nextPendingViews;

            if (nextPendingViews.length === 0) {
                break;
            }
        }
    } catch (e) {
        safeLog.warn('Refresh sequencial de MVs pendentes falhou:', e);
        summary.failedCount += 1;
    } finally {
        const hasRemaining = summary.remainingViews.length > 0;
        const hasFailures = summary.failedCount > 0;

        setRefreshState({
            isRefreshing: false,
            progress: hasRemaining || hasFailures ? 95 : 100,
            status: hasRemaining || hasFailures
                ? `Atualizacao parcial: ${summary.remainingViews.length} MV(s) pendente(s)`
                : 'Concluido'
        });
    }

    return summary;
};

const fetchPendingViews = async (maxPriority?: number): Promise<PendingMV[]> => {
    const { data, error } = await safeRpc<PendingMV[]>('get_pending_mvs', {}, {
        timeout: PENDING_LOOKUP_TIMEOUT_MS,
        validateParams: false
    });

    if (error) {
        safeLog.warn('Nao foi possivel consultar as MVs pendentes:', error);
        throw new Error(error.message || 'Nao foi possivel consultar as MVs pendentes');
    }

    const pendingViews = Array.isArray(data) ? data : [];

    if (typeof maxPriority !== 'number') {
        return pendingViews;
    }

    return pendingViews.filter((pendingView) => pendingView.priority <= maxPriority);
};
