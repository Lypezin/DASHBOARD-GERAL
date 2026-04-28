import { safeLog } from '@/lib/errorHandler';

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
        safeLog.info(`[performRefresh] Enfileirando refresh - force=${force}, isLowUsage=${isLowUsage}, context=${timeContext}`);
        setRefreshState(prev => ({
            ...prev,
            isRefreshing: true,
            progress: 30,
            status: 'Colocando atualizacao em fila...'
        }));

        if (!isLowUsage && !force) {
            setRefreshState({ isRefreshing: false, progress: 0, status: '' });
            return;
        }

        const response = await fetch('/api/mvs/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                reason: force ? 'upload' : 'scheduled',
                includeSecondary: true,
                requireAdmin: false
            })
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.error || `Erro HTTP ${response.status} ao enfileirar refresh.`);
        }

        const pendingCount = Array.isArray(payload?.pending) ? payload.pending.length : 0;
        setRefreshState({
            isRefreshing: false,
            progress: 100,
            status: pendingCount > 0
                ? `${pendingCount} atualizacao(oes) em fila. O sistema vai processar em segundo plano.`
                : 'Atualizacao em fila.'
        });
    } catch (e) {
        safeLog.warn('Refresh automatico de MVs falhou ao enfileirar:', e);
        setRefreshState({
            isRefreshing: false,
            progress: 0,
            status: 'Erro ao enfileirar atualizacao automatica'
        });
    }
};
