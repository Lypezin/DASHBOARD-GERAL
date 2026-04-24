import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type {
    PendingMV,
    RefreshMVResult,
    RefreshPrioritizedResult,
} from '@/types/upload';

export interface RefreshState {
    isRefreshing: boolean;
    progress: number;
    status: string;
}

export type SetRefreshState = (
    state: RefreshState | ((prev: RefreshState) => RefreshState)
) => void;

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
            timeout: 30000,
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
                force ? 'imediato (nucleo critico)' : 'automatico (so criticas)'
            }`
        );

        setRefreshState(prev => ({
            ...prev,
            progress: 30,
            status: force
                ? 'Atualizando views criticas agora...'
                : 'Atualizando views criticas...'
        }));

        const { data, error } = await safeRpc<RefreshPrioritizedResult>(
            'refresh_mvs_prioritized',
            { refresh_critical_only: true },
            {
                timeout: 900000,
                validateParams: false
            }
        );
        safeLog.info(
            `[performRefresh] Passo 2 concluido: success=${data?.success}, error=${
                error ? JSON.stringify(error) : 'none'
            }`
        );

        if (error) {
            const errorCode = error?.code;
            const is404 =
                errorCode === 'PGRST116' ||
                errorCode === '42883' ||
                error?.message?.includes('404');
            if (!is404) {
                safeLog.warn(
                    `Refresh prioritario falhou (${errorCode}): ${
                        error?.message || 'erro desconhecido'
                    }`
                );
            }
        } else if (data?.success) {
            logRefreshSuccess(data);
        }

        await refreshPendingViewsSequentially(setRefreshState);
    } catch (e) {
        safeLog.warn('Refresh prioritario nao disponivel, sera processado automaticamente', e);
        setRefreshState({
            isRefreshing: false,
            progress: 0,
            status: 'Erro ao atualizar (tentara automaticamente)'
        });
    }
};

const logRefreshSuccess = (data: RefreshPrioritizedResult) => {
    const duration = data.total_duration_seconds
        ? `${(data.total_duration_seconds / 60).toFixed(1)} min`
        : 'N/A';
    const viewsCount = data.views_refreshed || 0;
    safeLog.info(`Refresh de MVs criticas concluido: ${viewsCount} MVs em ${duration}`);

    if (data.results) {
        data.results.forEach((result) => {
            if (result.success) {
                const mvDuration = result.duration_seconds
                    ? `${result.duration_seconds.toFixed(1)}s`
                    : 'N/A';
                safeLog.info(`  - ${result.view}: ${result.method || 'NORMAL'} em ${mvDuration}`);
            } else {
                safeLog.warn(`  - ${result.view}: FALHOU`);
            }
        });
    }
};

const refreshPendingViewsSequentially = async (setRefreshState: SetRefreshState) => {
    try {
        const { data, error } = await safeRpc<PendingMV[]>('get_pending_mvs', {}, {
            timeout: 30000,
            validateParams: false
        });

        if (error) {
            safeLog.warn('Nao foi possivel consultar as MVs pendentes:', error);
            return;
        }

        const pendingViews = Array.isArray(data) ? data : [];

        if (pendingViews.length === 0) {
            safeLog.info('[performRefresh] Nenhuma MV pendente restante apos o refresh critico');
            return;
        }

        safeLog.info(
            `[performRefresh] Iniciando refresh sequencial de ${pendingViews.length} MVs pendentes`
        );

        let processedCount = 0;

        for (const pendingView of pendingViews) {
            const baseProgress = 72 + Math.round((processedCount / pendingViews.length) * 24);
            setRefreshState(prev => ({
                ...prev,
                progress: baseProgress,
                status: `Atualizando ${pendingView.mv_name}...`
            }));

            const { data: result, error: refreshError } = await safeRpc<RefreshMVResult>(
                'refresh_single_mv',
                { mv_name_param: pendingView.mv_name, force_normal: false },
                {
                    timeout: 180000,
                    validateParams: false
                }
            );

            if (refreshError) {
                safeLog.warn(
                    `[performRefresh] Falha ao atualizar ${pendingView.mv_name}:`,
                    refreshError
                );
            } else {
                safeLog.info(`[performRefresh] ${pendingView.mv_name} concluida:`, result);
            }

            processedCount += 1;
        }
    } catch (e) {
        safeLog.warn('Refresh sequencial de MVs pendentes falhou:', e);
    } finally {
        setRefreshState({
            isRefreshing: false,
            progress: 100,
            status: 'Concluido'
        });
    }
};
