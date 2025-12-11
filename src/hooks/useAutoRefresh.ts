import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { isLowUsageTime, getTimeContextMessage } from '@/utils/timeHelpers';
import type { RefreshPrioritizedResult } from '@/types/upload';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAutoRefresh() {
    const startAutoRefresh = useCallback(async (force = false) => {
        try {
            // Verificar se é horário de baixo uso para refresh automático
            const isLowUsage = isLowUsageTime();
            const timeContext = getTimeContextMessage();

            if (!isLowUsage && !force && IS_DEV) {
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

                    // Se não for horário de baixo uso E não estiver forçando, apenas marcar como pendente e retornar
                    if (!isLowUsage && !force) {
                        if (IS_DEV) {
                            safeLog.info('✅ MVs marcadas como pendentes. Refresh será feito em horário de baixo uso ou manualmente.');
                        }
                        return;
                    }

                    if (IS_DEV) {
                        safeLog.info(`✅ ${timeContext} - Iniciando refresh ${force ? 'FORÇADO' : 'automático'} de MVs`);
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

    return { startAutoRefresh };
}
