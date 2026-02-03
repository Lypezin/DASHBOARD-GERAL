import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import type { RefreshMVState, PendingMV } from '@/types/upload';
import { mvService } from '@/services/mvService';
import { processMVBatch } from '@/utils/refresh/batchProcessor';

export function useManualRefresh() {
    const [state, setState] = useState<RefreshMVState>({
        refreshing: false, message: '', progress: 0, progressLabel: '', total: 0, completed: 0, failedMVs: [],
    });

    const runBatch = useCallback(async (mvs: PendingMV[], isRetry = false) => {
        const startTime = Date.now();
        const totalMVs = mvs.length;

        setState(prev => ({
            ...prev,
            refreshing: true,
            total: totalMVs,
            message: isRetry ? `🔄 Tentando atualizar novamente ${totalMVs} MVs...` : `🔄 Atualizando ${totalMVs} Materialized Views...`,
            progressLabel: `0 / ${totalMVs} atualizadas`,
            failedMVs: prev.failedMVs // Keep existing failed initially? Or clear? Usually clear for new run.
        }));

        const { successCount, failCount, failedViews } = await processMVBatch(mvs, (prog) => {
            setState(prev => ({
                ...prev,
                progressLabel: `Atualizando ${prog.current}/${prog.total}: ${prog.currentMv}`,
                progress: (prog.current / prog.total) * 100,
                completed: prog.completed,
            }));
        });

        const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        const finalText = failCount === 0
            ? `✅ Todas as ${totalMVs} MVs atualizadas com sucesso em ${totalDuration} min!`
            : `✅ ${successCount}/${totalMVs} MVs atualizadas. ${failCount} falharam: ${failedViews.slice(0, 3).join(', ')}${failedViews.length > 3 ? '...' : ''}.`;

        setState(prev => ({
            ...prev,
            refreshing: false,
            progress: 100,
            completed: totalMVs,
            failedMVs: failedViews,
            message: finalText
        }));

        safeLog.info(`✅ Refresh concluído: ${successCount}/${totalMVs} em ${totalDuration} min`);
        setTimeout(() => setState(p => ({ ...p, progress: 0, progressLabel: '', total: 0, completed: 0 })), 5000);
    }, []);

    const refreshAllMVs = useCallback(async () => {
        setState(p => ({ ...p, refreshing: true, message: '🔄 Preparando...', progress: 0 }));

        try {
            const { data, error } = await mvService.getPendingMVs();

            if (error) {
                throw new Error(error.message || 'Falha ao buscar MVs pendentes.');
            }

            const mvs = data && data.length > 0 ? data : [{ mv_name: 'mv_dashboard_resumo', priority: 1 } as unknown as PendingMV];

            // Ensure aderencia exists
            if (!mvs.some((m: PendingMV) => m.mv_name === 'mv_aderencia_agregada')) {
                // Ensure unique
                mvs.push({ mv_name: 'mv_aderencia_agregada', priority: 1 } as unknown as PendingMV);
            }

            // Ensure utr exists
            if (!mvs.some((m: PendingMV) => m.mv_name === 'mv_utr_stats')) {
                mvs.push({ mv_name: 'mv_utr_stats', priority: 1 } as unknown as PendingMV);
            }

            await runBatch(mvs);
        } catch (err: any) {
            setState(p => ({ ...p, refreshing: false, message: `❌ Erro: ${err.message}` }));
            safeLog.error('Erro refresh all:', err);
        }
    }, [runBatch]);

    const retryFailedMVs = useCallback(async () => {
        if (state.failedMVs.length === 0) return setState(p => ({ ...p, message: 'ℹ️ Nenhuma MV falhou.' }));

        // Convert string[] to PendingMV[]
        const mvs = state.failedMVs.map(name => ({ mv_name: name, priority: 1 } as unknown as PendingMV));
        await runBatch(mvs, true);
    }, [state.failedMVs, runBatch]);

    return { state, refreshAllMVs, retryFailedMVs };
}
