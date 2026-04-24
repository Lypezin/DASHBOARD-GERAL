import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { RefreshPrioritizedResult } from '@/types/upload';

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

        safeLog.info(
            '[performRefresh] Passo 3: Chamando refresh_mvs_prioritized com refresh_critical_only=true...'
        );
        const { data, error } = await safeRpc<RefreshPrioritizedResult>(
            'refresh_mvs_prioritized',
            { refresh_critical_only: true },
            {
                timeout: 900000,
                validateParams: false
            }
        );
        safeLog.info(
            `[performRefresh] Passo 3 concluido: success=${data?.success}, error=${
                error ? JSON.stringify(error) : 'none'
            }`
        );

        setRefreshState(prev => ({
            ...prev,
            progress: 70,
            status: 'Processando views pendentes...'
        }));

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

        await finalizePendingRefreshes(setRefreshState);
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

const finalizePendingRefreshes = async (setRefreshState: SetRefreshState) => {
    try {
        setRefreshState(prev => ({
            ...prev,
            progress: 90,
            status: 'Finalizando views pendentes...'
        }));

        const { data, error } = await safeRpc<
            Array<{ mv_name: string; success: boolean; message: string }>
        >('refresh_pending_mvs', {}, { timeout: 900000, validateParams: false });

        if (error) {
            safeLog.warn('Refresh de MVs pendentes falhou:', error);
        } else if (Array.isArray(data)) {
            const failed = data.filter((item) => !item.success);
            if (failed.length > 0) {
                safeLog.warn('[performRefresh] Algumas MVs falharam no refresh pendente:', failed);
            } else {
                safeLog.info(`Refresh pendente concluido: ${data.length} MVs processadas`);
            }
        }
    } catch (e) {
        safeLog.warn('Refresh de MVs pendentes falhou:', e);
    } finally {
        setRefreshState({
            isRefreshing: false,
            progress: 100,
            status: 'Concluido'
        });
    }
};
