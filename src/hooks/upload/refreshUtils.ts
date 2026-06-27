import { safeLog } from '@/lib/errorHandler';
import { mvService } from '@/services/mvService';
import { sleep } from '@/utils/async/sleep';
import { REFRESH_MAX_MONITORING_MS, REFRESH_POLL_INTERVAL_MS } from './refreshTiming';

export interface RefreshState {
    isRefreshing: boolean;
    progress: number;
    status: string;
}

export type SetRefreshState = (
    state: RefreshState | ((prev: RefreshState) => RefreshState)
) => void;

export interface RefreshQueueState {
    success?: boolean;
    full_pending_count?: number;
    full_in_progress_count?: number;
    incremental_pending_count?: number;
    incremental_dashboard_pending?: number;
    incremental_entregadores_pending?: number;
    incremental_comparison_pending?: number;
    incremental_corridas_pending?: number;
    full_worker_scheduled?: boolean;
    incremental_worker_scheduled?: boolean;
}

function getPendingCount(payload: any) {
    if (Array.isArray(payload?.pending)) return payload.pending.length;

    const queuePendingCount = payload?.queue_result?.pending_count;
    if (typeof queuePendingCount === 'number') return queuePendingCount;

    const workerPendingCount = payload?.worker_result?.pending_count;
    if (typeof workerPendingCount === 'number') return workerPendingCount;

    return 0;
}

function getIncrementalPendingCount(payload: any) {
    const queueState = payload?.queue_state as RefreshQueueState | undefined;
    return Number(queueState?.incremental_pending_count || 0);
}

export function getTotalRefreshPendingCount(queueState: RefreshQueueState | null | undefined) {
    return Number(queueState?.full_pending_count || 0) + Number(queueState?.incremental_pending_count || 0);
}

export function getIncrementalRefreshPendingCount(queueState: RefreshQueueState | null | undefined) {
    return Number(queueState?.incremental_pending_count || 0);
}

export function buildRefreshStatusFromQueue(queueState: RefreshQueueState | null | undefined): RefreshState {
    const fullPending = Number(queueState?.full_pending_count || 0);
    const incrementalPending = Number(queueState?.incremental_pending_count || 0);
    const totalPending = fullPending + incrementalPending;

    if (totalPending <= 0) {
        return {
            isRefreshing: false,
            progress: 100,
            status: ''
        };
    }

    if (incrementalPending > 0 && fullPending === 0) {
        return {
            isRefreshing: true,
            progress: 65,
            status: `Atualizando Dashboard, UTR e Entrada/Saida em segundo plano: ${incrementalPending} impacto(s) pendente(s).`
        };
    }

    return {
        isRefreshing: true,
        progress: 45,
        status: `Atualizando dados agregados em segundo plano: ${totalPending} item(ns) pendente(s).`
    };
}

export function buildIncrementalRefreshStatusFromQueue(queueState: RefreshQueueState | null | undefined): RefreshState {
    const incrementalPending = getIncrementalRefreshPendingCount(queueState);

    if (incrementalPending <= 0) {
        return {
            isRefreshing: false,
            progress: 100,
            status: ''
        };
    }

    const dashboardPending = Number(queueState?.incremental_dashboard_pending || 0);
    const entregadoresPending = Number(queueState?.incremental_entregadores_pending || 0);
    const comparisonPending = Number(queueState?.incremental_comparison_pending || 0);
    const corridasPending = Number(queueState?.incremental_corridas_pending || 0);
    const pendingAreas = [
        dashboardPending > 0 ? 'Dashboard/UTR' : null,
        entregadoresPending > 0 ? 'Entregadores/Valores' : null,
        comparisonPending > 0 ? 'Comparacao' : null,
        corridasPending > 0 ? 'Entrada/Saida' : null,
    ].filter(Boolean).join(', ');

    return {
        isRefreshing: true,
        progress: 65,
        status: `Atualizando ${pendingAreas || 'dados agregados'} em segundo plano: ${incrementalPending} impacto(s) pendente(s).`
    };
}

export async function fetchRefreshQueueSnapshot() {
    const { data: payload, error } = await mvService.getRefreshQueueSnapshot<any>();
    if (error || !payload) throw new Error(error?.message || 'Erro ao acompanhar refresh.');

    return {
        payload,
        pendingCount: getPendingCount(payload),
        incrementalPendingCount: getIncrementalPendingCount(payload),
        queueState: payload?.queue_state as RefreshQueueState | null | undefined,
    };
}

async function fetchPendingCount(incrementalOnly = false) {
    const snapshot = await fetchRefreshQueueSnapshot();
    if (incrementalOnly) {
        return snapshot.incrementalPendingCount;
    }

    return snapshot.pendingCount + snapshot.incrementalPendingCount;
}

async function monitorRefreshQueue(
    initialPendingCount: number,
    setRefreshState: SetRefreshState,
    incrementalOnly = false
) {
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

    while (remaining > 0 && Date.now() - startedAt < REFRESH_MAX_MONITORING_MS) {
        const completed = Math.max(0, total - remaining);
        setRefreshState({
            isRefreshing: true,
            progress: Math.min(95, Math.max(35, Math.round((completed / total) * 100))),
            status: `Atualizando dados em segundo plano: ${completed}/${total} concluidos (${remaining} pendente(s)).`
        });

        await sleep(REFRESH_POLL_INTERVAL_MS);
        remaining = await fetchPendingCount(incrementalOnly);
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

        const { data, error } = await mvService.enqueueRefresh(force ? 'upload' : 'scheduled', true, false);
        if (error || !data) throw new Error(error?.message || 'Erro ao enfileirar refresh.');
        const payload = data as any;

        if (payload?.incremental_mode === true) {
            const secondaryPending = payload?.incremental_worker_result?.pending_count;
            const queuePending = getIncrementalPendingCount(payload);
            const pendingCount = Math.max(Number(secondaryPending || 0), queuePending);

            if (pendingCount > 0) {
                await monitorRefreshQueue(pendingCount, setRefreshState, true);
                return;
            }

            setRefreshState({
                isRefreshing: false,
                progress: 100,
                status: 'Dados agregados, Dashboard e UTR atualizados para a importacao.'
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
