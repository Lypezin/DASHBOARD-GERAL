import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type {
    RefreshMVState,
    RefreshMVResult,
    PendingMV,
    RetryFailedMVsResult,
} from '@/types/upload';

export function useManualRefresh() {
    const [state, setState] = useState<RefreshMVState>({
        refreshing: false,
        message: '',
        progress: 0,
        progressLabel: '',
        total: 0,
        completed: 0,
        failedMVs: [],
    });

    const processMVs = useCallback(async (mvs: PendingMV[]) => {
        // Garantir que mv_aderencia_agregada esteja na lista (se necessário)
        const aderenciaMvName = 'mv_aderencia_agregada';

        let mvsToProcess = [...mvs];

        // mv_dashboard_resumo agora é uma tabela atualizada via triggers, não precisa de refresh

        if (!mvsToProcess.some(mv => mv.mv_name === aderenciaMvName)) {
            mvsToProcess.push({ mv_name: aderenciaMvName, last_refresh: null, priority: 1, needs_refresh: true } as unknown as PendingMV);
        }

        if (!mvsToProcess.some(mv => mv.mv_name === aderenciaMvName)) {
            mvsToProcess.push({ mv_name: aderenciaMvName, last_refresh: null, priority: 1, needs_refresh: true } as unknown as PendingMV);
        }

        const totalMVs = mvsToProcess.length;
        setState(prev => ({
            ...prev,
            total: totalMVs,
            message: `🔄 Atualizando ${totalMVs} Materialized Views...`,
            progressLabel: `0 / ${totalMVs} atualizadas`,
        }));

        let successCount = 0;
        let failCount = 0;
        const failedViews: string[] = [];
        const startTime = Date.now();

        // Passo 2: Processar cada MV individualmente
        for (let i = 0; i < mvsToProcess.length; i++) {
            const mv = mvsToProcess[i];
            const currentIndex = i + 1;

            setState(prev => ({
                ...prev,
                progressLabel: `Atualizando ${currentIndex} / ${totalMVs}: ${mv.mv_name}`,
                progress: ((currentIndex - 1) / totalMVs) * 100,
            }));

            try {
                const { data: refreshData, error: refreshError } = await safeRpc<RefreshMVResult>(
                    'refresh_single_mv_with_progress',
                    { mv_name_param: mv.mv_name },
                    {
                        timeout: 300000, // 5 minutos por MV
                        validateParams: false
                    }
                );

                // Atualizar progresso após processar
                setState(prev => ({
                    ...prev,
                    progress: (currentIndex / totalMVs) * 100,
                    completed: currentIndex,
                }));

                // Verificar se houve erro na chamada RPC
                if (refreshError) {
                    const errorCode = refreshError?.code;
                    const errorMessage = String(refreshError?.message || '');
                    const isTimeout =
                        errorCode === 'TIMEOUT' ||
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('demorou muito');

                    if (isTimeout) {
                        safeLog.warn(
                            `Timeout ao atualizar ${mv.mv_name}(verificando se foi atualizada mesmo assim)`
                        );
                    } else {
                        failCount++;
                        failedViews.push(mv.mv_name);
                        safeLog.error(`Erro ao atualizar ${mv.mv_name}: `, refreshError);
                    }
                } else if (refreshData) {
                    // A função RPC retorna o resultado dentro de uma propriedade com o nome da função
                    const result = (refreshData as unknown as { refresh_single_mv_with_progress?: RefreshMVResult })
                        ?.refresh_single_mv_with_progress || refreshData;

                    const success = result?.success === true;
                    const viewName = result?.view || mv.mv_name;
                    const duration = result?.duration_seconds;
                    const method = result?.method;
                    const warning = result?.warning;
                    const error = result?.error;

                    // Se success = true OU se tem warning de fallback (que significa que funcionou), considerar sucesso
                    const isSuccess =
                        success ||
                        (warning && (warning.includes('fallback') || warning.includes('CONCURRENTLY falhou')));

                    if (isSuccess) {
                        successCount++;
                        const durationStr = duration ? `${duration.toFixed(1)}s` : 'N/A';
                        const methodStr = method || (warning ? 'FALLBACK' : 'NORMAL');
                        safeLog.info(`✅ ${viewName} atualizada em ${durationStr}(${methodStr})`);
                    } else {
                        failCount++;
                        failedViews.push(mv.mv_name);
                        const errorMsg = error || 'Erro desconhecido';
                        safeLog.warn(`Falha ao atualizar ${mv.mv_name}: ${errorMsg}`);
                    }
                } else {
                    failCount++;
                    failedViews.push(mv.mv_name);
                    safeLog.warn(`Resposta vazia ao atualizar ${mv.mv_name}`);
                }
            } catch (error) {
                failCount++;
                failedViews.push(mv.mv_name);
                setState(prev => ({
                    ...prev,
                    progress: (currentIndex / totalMVs) * 100,
                    completed: currentIndex,
                }));
                safeLog.error(`Erro ao atualizar ${mv.mv_name}: `, error);
            }

            // ⚠️ OTIMIZAÇÃO: Delay entre MVs para evitar sobrecarga do banco
            // Refresh sequencial é mais eficiente que simultâneo
            if (i < mvsToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Passo 3: Resumo final
        const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        setState(prev => ({
            ...prev,
            progress: 100,
            completed: totalMVs,
            failedMVs: failedViews,
            message:
                failCount === 0
                    ? `✅ Todas as ${totalMVs} Materialized Views foram atualizadas com sucesso em ${totalDuration} minutos!`
                    : `✅ ${successCount} de ${totalMVs} Materialized Views atualizadas com sucesso em ${totalDuration} minutos. ` +
                    `${failCount} falharam${failedViews.length > 0
                        ? `: ${failedViews.slice(0, 3).join(', ')}${failedViews.length > 3 ? '...' : ''}`
                        : ''
                    }.`,
        }));

        safeLog.info(`✅ Refresh concluído: ${successCount} / ${totalMVs} MVs atualizadas em ${totalDuration} minutos`);
    }, []);

    const refreshAllMVs = useCallback(async () => {
        setState(prev => ({
            ...prev,
            refreshing: true,
            message: '🔄 Preparando atualização...',
            progress: 0,
            completed: 0,
            total: 0,
            progressLabel: '',
            failedMVs: [],
        }));

        try {
            // Passo 1: Obter lista de MVs pendentes
            const { data: pendingData, error: pendingError } = await safeRpc<PendingMV[]>(
                'get_pending_mvs',
                {},
                {
                    timeout: 30000,
                    validateParams: false
                }
            );

            if (pendingError) {
                const errorMessage = pendingError?.message || 'Erro desconhecido';
                setState(prev => ({
                    ...prev,
                    message: `❌ Erro ao obter lista de MVs: ${errorMessage}`,
                    refreshing: false,
                }));
                safeLog.error('Erro ao obter MVs pendentes:', pendingError);
                return;
            }

            if (!pendingData || pendingData.length === 0) {
                // Mesmo se não houver pendentes, verificar se mv_dashboard_resumo precisa ser atualizada
                // Mas por segurança, vamos adicionar ela na lista abaixo se não estiver vazia
                // Se estiver vazia, vamos criar uma lista com ela
                const dashboardMv = { mv_name: 'mv_dashboard_resumo', last_refresh: null, priority: 1, needs_refresh: true } as unknown as PendingMV;
                const mvsToRefresh = [dashboardMv];

                // Continuar com a lógica usando mvsToRefresh
                await processMVs(mvsToRefresh);
                return;
            }

            await processMVs(pendingData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setState(prev => ({
                ...prev,
                message: `❌ Erro ao atualizar: ${errorMessage}`,
            }));
            safeLog.error('Erro ao atualizar MVs:', error);
        } finally {
            setState(prev => ({ ...prev, refreshing: false }));
            // Manter progresso por alguns segundos antes de resetar
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    progress: 0,
                    progressLabel: '',
                    total: 0,
                    completed: 0,
                }));
            }, 5000);
        }
    }, [processMVs]);

    const retryFailedMVs = useCallback(async () => {
        let currentFailedMVs: string[] = [];

        setState(prev => {
            if (prev.failedMVs.length === 0) {
                return {
                    ...prev,
                    message: 'ℹ️ Nenhuma MV falhou para tentar novamente.',
                };
            }

            currentFailedMVs = prev.failedMVs;

            return {
                ...prev,
                refreshing: true,
                message: `🔄 Tentando atualizar novamente ${currentFailedMVs.length} Materialized Views que falharam...`,
                progress: 0,
                completed: 0,
                total: currentFailedMVs.length,
                progressLabel: `0 / ${currentFailedMVs.length} atualizadas`,
            };
        });

        try {
            const { data, error } = await safeRpc<RetryFailedMVsResult>(
                'retry_failed_mvs',
                { mv_names: currentFailedMVs },
                {
                    timeout: 600000, // 10 minutos
                    validateParams: false
                }
            );

            if (error) {
                const errorMessage = error?.message || 'Erro desconhecido';
                setState(prev => ({
                    ...prev,
                    message: `❌ Erro ao tentar atualizar novamente: ${errorMessage}`,
                    refreshing: false,
                }));
                safeLog.error('Erro ao retry MVs:', error);
                return;
            }

            const result = (data as unknown as { retry_failed_mvs?: RetryFailedMVsResult })
                ?.retry_failed_mvs || data;
            const successCount = result?.success_count || 0;
            const failCount = result?.fail_count || 0;
            const totalDuration = result?.total_duration_seconds
                ? `${(result.total_duration_seconds / 60).toFixed(1)} minutos`
                : 'N/A';

            setState(prev => ({
                ...prev,
                progress: 100,
                completed: currentFailedMVs.length,
                failedMVs:
                    failCount === 0
                        ? []
                        : (() => {
                            const stillFailed: string[] = [];
                            if (result?.results) {
                                result.results.forEach((r) => {
                                    const res = (r as unknown as { retry_failed_mvs?: RefreshMVResult })?.retry_failed_mvs || r;
                                    if (!res.success) {
                                        stillFailed.push(res.view || '');
                                    }
                                });
                            }
                            return stillFailed;
                        })(),
                message:
                    failCount === 0
                        ? `✅ Todas as ${currentFailedMVs.length} Materialized Views foram atualizadas com sucesso em ${totalDuration} !`
                        : `✅ ${successCount} de ${currentFailedMVs.length} Materialized Views atualizadas com sucesso em ${totalDuration}.` +
                        `${failCount} ainda falharam.`,
            }));

            safeLog.info(`✅ Retry concluído: ${successCount}/${currentFailedMVs.length} MVs atualizadas`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setState(prev => ({
                ...prev,
                message: `❌ Erro ao tentar atualizar novamente: ${errorMessage}`,
            }));
            safeLog.error('Erro ao retry MVs:', error);
        } finally {
            setState(prev => ({ ...prev, refreshing: false }));
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    progress: 0,
                    progressLabel: '',
                    total: 0,
                    completed: 0,
                }));
            }, 5000);
        }
    }, []);

    return {
        state,
        refreshAllMVs,
        retryFailedMVs,
    };
}
