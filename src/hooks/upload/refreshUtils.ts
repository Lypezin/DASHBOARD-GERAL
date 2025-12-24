
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { RefreshPrioritizedResult } from '@/types/upload';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface RefreshState {
    isRefreshing: boolean;
    progress: number;
    status: string;
}

export type SetRefreshState = (state: RefreshState | ((prev: RefreshState) => RefreshState)) => void;

export const performRefresh = async (
    force: boolean,
    isLowUsage: boolean,
    timeContext: string,
    setRefreshState: SetRefreshState
) => {
    try {
        setRefreshState(prev => ({ ...prev, progress: 10, status: 'Preparando views...' }));

        await safeRpc('refresh_mvs_after_bulk_insert', { delay_seconds: 5 }, {
            timeout: 30000,
            validateParams: false
        });

        if (!isLowUsage && !force) {
            if (IS_DEV) {
                safeLog.info('✅ MVs marcadas como pendentes. Refresh será feito em horário de baixo uso ou manualmente.');
            }
            setRefreshState({ isRefreshing: false, progress: 0, status: '' });
            return;
        }

        if (IS_DEV) {
            safeLog.info(`✅ ${timeContext} - Iniciando refresh ${force ? 'FORÇADO' : 'automático'} de MVs`);
        }

        setRefreshState(prev => ({ ...prev, progress: 30, status: 'Atualizando views críticas...' }));

        const { data, error } = await safeRpc<RefreshPrioritizedResult>(
            'refresh_mvs_prioritized',
            { refresh_critical_only: true },
            {
                timeout: 300000,
                validateParams: false
            }
        );

        setRefreshState(prev => ({ ...prev, progress: 70, status: 'Processando views secundárias...' }));

        if (error) {
            const errorCode = error?.code;
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' || error?.message?.includes('404');
            if (!is404 && IS_DEV) {
                safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
            }
        } else if (data?.success && IS_DEV) {
            logRefreshSuccess(data);
        }

        scheduleBackgroundRefresh(setRefreshState);

    } catch (e) {
        if (IS_DEV) {
            safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
        }
        setRefreshState({ isRefreshing: false, progress: 0, status: 'Erro ao atualizar (tentará automaticamente)' });
    }
};

const logRefreshSuccess = (data: RefreshPrioritizedResult) => {
    const duration = data.total_duration_seconds
        ? `${(data.total_duration_seconds / 60).toFixed(1)} min`
        : 'N/A';
    const viewsCount = data.views_refreshed || 0;
    safeLog.info(`✅ Refresh de MVs críticas concluído: ${viewsCount} MVs em ${duration}`);

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

const scheduleBackgroundRefresh = (setRefreshState: SetRefreshState) => {
    setTimeout(async () => {
        try {
            setRefreshState(prev => ({ ...prev, progress: 90, status: 'Finalizando...' }));
            await safeRpc('refresh_pending_mvs', {}, {
                timeout: 600000,
                validateParams: false
            });
            if (IS_DEV) {
                safeLog.info('Refresh de MVs secundárias iniciado em background');
            }
        } catch (e) {
            if (IS_DEV) {
                safeLog.warn('Refresh de MVs secundárias não disponível, será processado automaticamente');
            }
        } finally {
            setRefreshState({ isRefreshing: false, progress: 100, status: 'Concluído' });
        }
    }, 5000);
};
