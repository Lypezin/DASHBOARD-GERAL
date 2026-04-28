import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import type { RefreshMVState } from '@/types/upload';
import { mvService } from '@/services/mvService';

const RESET_DELAY_MS = 5000;

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

            const pending = data?.pending || [];
            const pendingCount = pending.length;

            setState(prev => ({
                ...prev,
                refreshing: false,
                progress: 100,
                total: pendingCount,
                completed: 0,
                failedMVs: [],
                progressLabel: pendingCount > 0
                    ? `${pendingCount} MV(s) aguardando processamento`
                    : 'Fila conferida',
                message: pendingCount > 0
                    ? `${pendingCount} MV(s) em fila. O Supabase vai atualizar uma por vez automaticamente.`
                    : 'Nenhuma MV pendente no momento.'
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
