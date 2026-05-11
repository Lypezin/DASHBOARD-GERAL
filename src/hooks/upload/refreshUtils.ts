import { safeLog } from '@/lib/errorHandler';

export interface RefreshState {
    isRefreshing: boolean;
    progress: number;
    status: string;
}

export type SetRefreshState = (
    state: RefreshState | ((prev: RefreshState) => RefreshState)
) => void;

const POLL_INTERVAL_MS = 5000;
const MAX_MONITORING_MS = 60 * 60 * 1000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getPendingCount(payload: any) {
    if (Array.isArray(payload?.pending)) return payload.pending.length;

    const queuePendingCount = payload?.queue_result?.pending_count;
    if (typeof queuePendingCount === 'number') return queuePendingCount;

    const workerPendingCount = payload?.worker_result?.pending_count;
    if (typeof workerPendingCount === 'number') return workerPendingCount;

    return 0;
}

async function fetchPendingCount() {
    const response = await fetch('/api/mvs/refresh', {
        method: 'GET',
        credentials: 'same-origin'
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `Erro HTTP ${response.status} ao acompanhar refresh.`);
    }

    return getPendingCount(payload);
}

async function monitorRefreshQueue(initialPendingCount: number, setRefreshState: SetRefreshState) {
    if (initialPendingCount <= 0) {
        setRefreshState({
            isRefreshing: false,
            progress: 100,
            status: 'Atualizacao das MVs concluida.'
        });
        return;
    }

    const startedAt = Date.now();
    let total = Math.max(initialPendingCount, 1);
    let remaining = initialPendingCount;

    while (remaining > 0 && Date.now() - startedAt < MAX_MONITORING_MS) {
        const completed = Math.max(0, total - remaining);
        setRefreshState({
            isRefreshing: true,
            progress: Math.min(95, Math.max(35, Math.round((completed / total) * 100))),
            status: `Atualizando MVs em segundo plano: ${completed}/${total} concluidas (${remaining} pendente(s)).`
        });

        await wait(POLL_INTERVAL_MS);
        remaining = await fetchPendingCount();
        total = Math.max(total, remaining);
    }

    if (remaining === 0) {
        setRefreshState({
            isRefreshing: false,
            progress: 100,
            status: 'Atualizacao das MVs concluida.'
        });
        return;
    }

    setRefreshState({
        isRefreshing: false,
        progress: 95,
        status: 'Atualizacao ainda em andamento no Supabase. Voce pode continuar usando o sistema.'
    });
}

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

        if (payload?.incremental_mode === true) {
            const secondaryPending = payload?.incremental_worker_result?.pending_count;
            setRefreshState({
                isRefreshing: false,
                progress: 100,
                status: secondaryPending > 0
                    ? 'Dados importados. Dashboard, UTR e Entrada/Saida finalizam em segundo plano.'
                    : 'Dados agregados, Dashboard e UTR atualizados para a importacao.'
            });
            return;
        }

        const pendingCount = getPendingCount(payload);
        await monitorRefreshQueue(pendingCount, setRefreshState);
    } catch (e) {
        safeLog.warn('Refresh automatico de MVs falhou ao enfileirar:', e);
        setRefreshState({
            isRefreshing: false,
            progress: 0,
            status: 'Erro ao enfileirar atualizacao automatica'
        });
    }
};
