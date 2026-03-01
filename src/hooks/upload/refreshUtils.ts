import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { RefreshPrioritizedResult } from '@/types/upload';

export interface RefreshState { isRefreshing: boolean; progress: number; status: string; }

export type SetRefreshState = (state: RefreshState | ((prev: RefreshState) => RefreshState)) => void;

export const performRefresh = async (force: boolean, isLowUsage: boolean, timeContext: string, setRefreshState: SetRefreshState) => {
    try {
        safeLog.info(`[performRefresh] Iniciando - force=${force}, isLowUsage=${isLowUsage}`);
        setRefreshState(prev => ({ ...prev, progress: 10, status: 'Preparando views...' }));

        safeLog.info('[performRefresh] Passo 1: Chamando refresh_mvs_after_bulk_insert...');
        const bulkResult = await safeRpc('refresh_mvs_after_bulk_insert', { delay_seconds: 5 }, {
            timeout: 30000,
            validateParams: false
        });
        safeLog.info(`[performRefresh] Passo 1 concluído: data=${JSON.stringify(bulkResult.data)}, error=${JSON.stringify(bulkResult.error)}`);

        if (!isLowUsage && !force) {
            safeLog.info('[performRefresh] Refresh adiado - não é horário de baixo uso e não foi forçado');
            setRefreshState({ isRefreshing: false, progress: 0, status: '' });
            return;
        }

        safeLog.info(`[performRefresh] Passo 2: ${timeContext} - Iniciando refresh ${force ? 'FORÇADO (TODAS MVs)' : 'automático (só críticas)'}`);

        const refreshAll = force;
        setRefreshState(prev => ({ ...prev, progress: 30, status: refreshAll ? 'Atualizando TODAS as views...' : 'Atualizando views críticas...' }));

        safeLog.info(`[performRefresh] Passo 3: Chamando refresh_mvs_prioritized com refresh_critical_only=${!refreshAll}...`);
        const { data, error } = await safeRpc<RefreshPrioritizedResult>(
            'refresh_mvs_prioritized',
            { refresh_critical_only: !refreshAll },
            {
                timeout: 300000,
                validateParams: false
            }
        );
        safeLog.info(`[performRefresh] Passo 3 concluído: success=${data?.success}, error=${error ? JSON.stringify(error) : 'none'}`);

        setRefreshState(prev => ({ ...prev, progress: 70, status: 'Processando views secundárias...' }));

        if (error) {
            const errorCode = error?.code;
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' || error?.message?.includes('404');
            if (!is404) {
                safeLog.warn(`Refresh prioritário falhou (${errorCode}): ${error?.message || 'erro desconhecido'}`);
            }
        } else if (data?.success) {
            logRefreshSuccess(data);
        }

        scheduleBackgroundRefresh(setRefreshState);

    } catch (e) {
        safeLog.warn('Refresh prioritário não disponível, será processado automaticamente', e);
        setRefreshState({ isRefreshing: false, progress: 0, status: 'Erro ao atualizar (tentará automaticamente)' });
    }
};

const logRefreshSuccess = (data: RefreshPrioritizedResult) => {
    const duration = data.total_duration_seconds ? `${(data.total_duration_seconds / 60).toFixed(1)} min` : 'N/A';
    const viewsCount = data.views_refreshed || 0;
    safeLog.info(`✅ Refresh de MVs críticas concluído: ${viewsCount} MVs em ${duration}`);

    if (data.results) {
        data.results.forEach((result) => {
            if (result.success) {
                const mvDuration = result.duration_seconds ? `${result.duration_seconds.toFixed(1)}s` : 'N/A';
                safeLog.info(`  - ${result.view}: ${result.method || 'NORMAL'} em ${mvDuration}`);
            } else safeLog.warn(`  - ${result.view}: FALHOU`);
        });
    }
};

const scheduleBackgroundRefresh = (setRefreshState: SetRefreshState) => {
    setTimeout(async () => {
        try {
            setRefreshState(prev => ({ ...prev, progress: 90, status: 'Finalizando...' }));
            await safeRpc('refresh_pending_mvs', {}, { timeout: 600000, validateParams: false });
            // Explicitly refresh UTR stats to ensure it's up to date
            await safeRpc('refresh_single_mv_with_progress', { mv_name_param: 'mv_utr_stats' }, { timeout: 300000, validateParams: false });
            safeLog.info('✅ Refresh de MVs secundárias concluído em background');
        } catch (e) {
            safeLog.warn('⚠️ Refresh de MVs secundárias falhou:', e);
        } finally { setRefreshState({ isRefreshing: false, progress: 100, status: 'Concluído' }); }
    }, 5000);
};
