/**
 * Hook para gerenciar refresh de Materialized Views após upload
 * 
 * Otimizações implementadas:
 * - Refresh sequencial (não simultâneo) para evitar sobrecarga
 * - Verificação de horário de baixo uso para refresh automático
 * - Uso de REFRESH CONCURRENTLY quando disponível
 * - Delays entre MVs para evitar sobrecarga do banco
 */

import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { isLowUsageTime, getTimeContextMessage, shouldRefreshMVsNow } from '@/utils/timeHelpers';
import type {
  RefreshMVState,
  RefreshMVResult,
  RefreshPrioritizedResult,
  PendingMV,
  RetryFailedMVsResult,
} from '@/types/upload';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook para gerenciar refresh de Materialized Views
 */
export function useUploadRefresh() {
  const [state, setState] = useState<RefreshMVState>({
    refreshing: false,
    message: '',
    progress: 0,
    progressLabel: '',
    total: 0,
    completed: 0,
    failedMVs: [],
  });

  /**
   * Inicia refresh automático após upload bem-sucedido
   * 
   * ⚠️ OTIMIZAÇÃO: Verifica horário de baixo uso antes de iniciar refresh automático
   * Se não for horário de baixo uso, apenas marca as MVs como pendentes
   * para refresh posterior (via agendamento ou refresh manual)
   */
  const startAutoRefresh = useCallback(async () => {
    try {
      // Verificar se é horário de baixo uso para refresh automático
      const isLowUsage = isLowUsageTime();
      const timeContext = getTimeContextMessage();
      
      if (!isLowUsage && IS_DEV) {
        safeLog.info(`⏰ ${timeContext} - Refresh automático será adiado para horário de baixo uso`);
        safeLog.info('💡 Dica: Use o botão "Atualizar Materialized Views" para forçar refresh imediato');
      }
      
      // Delay antes de iniciar refresh (permite que inserções terminem)
      setTimeout(async () => {
        try {
          // Passo 1: Marcar todas as MVs relacionadas como precisando refresh
          await safeRpc('refresh_mvs_after_bulk_insert', { delay_seconds: 5 }, {
            timeout: 30000,
            validateParams: false
          });
          
          // Se não for horário de baixo uso, apenas marcar como pendente e retornar
          if (!isLowUsage) {
            if (IS_DEV) {
              safeLog.info('✅ MVs marcadas como pendentes. Refresh será feito em horário de baixo uso ou manualmente.');
            }
            return;
          }
          
          if (IS_DEV) {
            safeLog.info(`✅ ${timeContext} - Iniciando refresh automático de MVs`);
          }

          // Passo 2: Atualizar apenas MVs críticas imediatamente (prioridade 1)
          const { data, error } = await safeRpc<RefreshPrioritizedResult>(
            'refresh_mvs_prioritized',
            { refresh_critical_only: true },
            {
              timeout: 300000, // 5 minutos para MVs críticas
              validateParams: false
            }
          );

          if (error) {
            const errorCode = error?.code;
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' || error?.message?.includes('404');
            if (!is404 && IS_DEV) {
              safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
            }
          } else if (data?.success && IS_DEV) {
            const duration = data.total_duration_seconds
              ? `${(data.total_duration_seconds / 60).toFixed(1)} min`
              : 'N/A';
            const viewsCount = data.views_refreshed || 0;
            safeLog.info(`✅ Refresh de MVs críticas concluído: ${viewsCount} MVs em ${duration}`);

            // Log detalhado de cada MV
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
          }

          // Passo 3: Iniciar refresh assíncrono das MVs secundárias em background
          setTimeout(async () => {
            try {
              await safeRpc('refresh_pending_mvs', {}, {
                timeout: 600000, // 10 minutos para todas as MVs secundárias
                validateParams: false
              });
              if (IS_DEV) {
                safeLog.info('Refresh de MVs secundárias iniciado em background');
              }
            } catch (e) {
              if (IS_DEV) {
                safeLog.warn('Refresh de MVs secundárias não disponível, será processado automaticamente');
              }
            }
          }, 5000); // Delay de 5 segundos antes de iniciar MVs secundárias

        } catch (e) {
          // Silenciar erros - o refresh será feito automaticamente
          if (IS_DEV) {
            safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
          }
        }
      }, 2000); // Delay de 2 segundos após upload
    } catch (e) {
      // Silenciar erros - o refresh será feito automaticamente
      if (IS_DEV) {
        safeLog.warn('Erro ao iniciar refresh de MVs');
      }
    }
  }, []);

  /**
   * Atualiza todas as Materialized Views manualmente
   * 
   * ⚠️ OTIMIZAÇÃO: Refresh sequencial com delays entre MVs
   * - Processa uma MV por vez para evitar sobrecarga
   * - Delay de 500ms entre cada MV
   * - Usa REFRESH CONCURRENTLY quando disponível (via RPC)
   */
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
        setState(prev => ({
          ...prev,
          message: '✅ Nenhuma Materialized View precisa ser atualizada!',
          refreshing: false,
        }));
        return;
      }

      const totalMVs = pendingData.length;
      setState(prev => ({
        ...prev,
        total: totalMVs,
        message: `🔄 Atualizando ${totalMVs} Materialized Views...`,
        progressLabel: `0/${totalMVs} atualizadas`,
      }));

      let successCount = 0;
      let failCount = 0;
      const failedViews: string[] = [];
      const startTime = Date.now();

      // Passo 2: Processar cada MV individualmente
      for (let i = 0; i < pendingData.length; i++) {
        const mv = pendingData[i];
        const currentIndex = i + 1;

        setState(prev => ({
          ...prev,
          progressLabel: `Atualizando ${currentIndex}/${totalMVs}: ${mv.mv_name}`,
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
                `Timeout ao atualizar ${mv.mv_name} (verificando se foi atualizada mesmo assim)`
              );
            } else {
              failCount++;
              failedViews.push(mv.mv_name);
              safeLog.error(`Erro ao atualizar ${mv.mv_name}:`, refreshError);
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
              safeLog.info(`✅ ${viewName} atualizada em ${durationStr} (${methodStr})`);
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
          safeLog.error(`Erro ao atualizar ${mv.mv_name}:`, error);
        }

        // ⚠️ OTIMIZAÇÃO: Delay entre MVs para evitar sobrecarga do banco
        // Refresh sequencial é mais eficiente que simultâneo
        if (i < pendingData.length - 1) {
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
              `${failCount} falharam${
                failedViews.length > 0
                  ? `: ${failedViews.slice(0, 3).join(', ')}${failedViews.length > 3 ? '...' : ''}`
                  : ''
              }.`,
      }));

      safeLog.info(`✅ Refresh concluído: ${successCount}/${totalMVs} MVs atualizadas em ${totalDuration} minutos`);
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
  }, []);

  /**
   * Tenta novamente atualizar as MVs que falharam
   */
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
        progressLabel: `0/${currentFailedMVs.length} atualizadas`,
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
            ? `✅ Todas as ${currentFailedMVs.length} Materialized Views foram atualizadas com sucesso em ${totalDuration}!`
            : `✅ ${successCount} de ${currentFailedMVs.length} Materialized Views atualizadas com sucesso em ${totalDuration}. ` +
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
    ...state,
    startAutoRefresh,
    refreshAllMVs,
    retryFailedMVs,
  };
}

