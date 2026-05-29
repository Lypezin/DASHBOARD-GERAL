import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import type { RefreshMVState } from '@/types/upload';
import { mvService } from '@/services/mvService';

const RESET_DELAY_MS = 5000;
const POLL_INTERVAL_MS = 5000;
const MAX_MONITORING_MS = 60 * 60 * 1000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    const enqueueRefresh = useCallback(async (reason: string, retryCount = 0) => {
        setState(prev => ({
            ...prev,
            refreshing: true,
            message: retryCount > 0
                ? `Enfileirando nova tentativa de atualizacao (${retryCount} item/ns)...`
                : 'Enfileirando atualizacao das views...',
            progress: 35,
            progressLabel: 'Aguardando worker em segundo plano',
            failedMVs: retryCount > 0 ? prev.failedMVs : []
        }));

        try {
            const { data, error } = await mvService.enqueueRefresh(reason, true, false);

            if (error) {
                throw new Error(error.message || 'Falha ao enfileirar MVs.');
            }

            let remaining = data?.pending?.length || 0;
            const total = Math.max(remaining, 1);
            const startedAt = Date.now();

            while (remaining > 0 && Date.now() - startedAt < MAX_MONITORING_MS) {
                const completed = Math.max(0, total - remaining);
                setState(prev => ({
                    ...prev,
                    refreshing: true,
                    progress: Math.min(95, Math.max(35, Math.round((completed / total) * 100))),
                    total,
                    completed,
                    failedMVs: [],
                    progressLabel: `${completed}/${total} MV(s) concluidas`,
                    message: `Atualizando MVs em segundo plano: ${remaining} pendente(s).`
                }));

                await wait(POLL_INTERVAL_MS);

                const { data: pendingData, error: pendingError } = await mvService.getPendingMVs();
                if (pendingError) throw new Error(pendingError.message || 'Falha ao acompanhar fila de MVs.');
                remaining = pendingData?.length || 0;
            }

            const completed = Math.max(0, total - remaining);
            setState(prev => ({
                ...prev,
                refreshing: false,
                progress: remaining === 0 ? 100 : 95,
                total,
                completed,
                failedMVs: [],
                progressLabel: remaining === 0 ? 'Fila concluida' : `${remaining} MV(s) ainda pendente(s)`,
                message: remaining === 0
                    ? 'Atualizacao das MVs concluida.'
                    : 'Atualizacao ainda em andamento no Supabase. Voce pode continuar usando o sistema.'
            }));

            setTimeout(() => {
                setState(prev => ({ ...prev, progress: 0, progressLabel: '', total: 0, completed: 0 }));
            }, RESET_DELAY_MS);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setState(prev => ({
                ...prev,
                refreshing: false,
                progress: 0,
                message: `Erro ao enfileirar atualizacao: ${msg}`
            }));
            safeLog.error('Erro ao enfileirar refresh:', err);
        }
    }, []);

    const refreshAllMVs = useCallback(async () => {
        await enqueueRefresh('manual');
    }, [enqueueRefresh]);

    const retryFailedMVs = useCallback(async () => {
        if (state.failedMVs.length === 0) {
            setState(prev => ({ ...prev, message: 'Nenhuma MV falhou localmente. Reenfileire a atualizacao se precisar.' }));
            return;
        }

        await enqueueRefresh('retry', state.failedMVs.length);
    }, [enqueueRefresh, state.failedMVs.length]);

    return { state, refreshAllMVs, retryFailedMVs };
}
