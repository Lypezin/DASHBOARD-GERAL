import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import {
    hasElevatedRole,
    loadCurrentUserProfile,
} from '@/app/api/_shared/currentUserProfile';
import type { PendingMV } from '@/types/upload';

export const runtime = 'nodejs';

async function requireApprovedUser() {
    const auth = await loadCurrentUserProfile({
        requireApproved: true,
        notApprovedMessage: 'Usuario nao aprovado.',
    });

    if ('failure' in auth) {
        return { error: NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status }) };
    }

    return { profile: auth.profile };
}

async function fetchPendingMVs(admin = createServiceRoleClient()) {
    const { data, error } = await admin.rpc('get_pending_mvs');

    if (error) {
        throw new Error(error.message || 'Falha ao consultar MVs pendentes.');
    }

    return (Array.isArray(data) ? data : []) as PendingMV[];
}

type QueueStatePayload = {
    full_pending_count?: number;
    full_in_progress_count?: number;
    incremental_pending_count?: number;
    full_worker_scheduled?: boolean;
    incremental_worker_scheduled?: boolean;
};

async function fetchQueueState(admin = createServiceRoleClient()) {
    const { data } = await admin.rpc('get_mv_refresh_queue_state');
    return (data ?? null) as QueueStatePayload | null;
}

async function healRefreshQueueSnapshot(admin = createServiceRoleClient()) {
    let state = await fetchQueueState(admin);

    const incrementalPending = Number(state?.incremental_pending_count || 0);
    const incrementalWorkerScheduled = state?.incremental_worker_scheduled === true;
    if (incrementalPending > 0 && !incrementalWorkerScheduled) {
        await admin.rpc('ensure_incremental_refresh_worker_scheduled');
        state = await fetchQueueState(admin);
    }

    const fullPending = Number(state?.full_pending_count || 0);
    const fullInProgress = Number(state?.full_in_progress_count || 0);
    const fullWorkerScheduled = state?.full_worker_scheduled === true;
    if (fullPending > 0 && fullInProgress === 0 && !fullWorkerScheduled) {
        await admin.rpc('clear_stale_full_mv_refresh_flags');
        state = await fetchQueueState(admin);
    }

    return state;
}

export async function GET() {
    try {
        const auth = await requireApprovedUser();
        if ('error' in auth) return auth.error;

        const admin = createServiceRoleClient();
        const stateData = await healRefreshQueueSnapshot(admin);
        const pending = await fetchPendingMVs(admin);

        return NextResponse.json({ success: true, pending, queue_state: stateData ?? null });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json({ ...getServiceRoleConfigErrorPayload(), pending: [] }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao consultar fila de atualizacao.';
        return NextResponse.json({ success: false, error: message, pending: [] }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireApprovedUser();
        if ('error' in auth) return auth.error;

        const body = await request.json().catch(() => ({}));
        const reason = typeof body?.reason === 'string' && body.reason.trim()
            ? body.reason.trim().slice(0, 80)
            : 'manual';
        const includeSecondary = body?.includeSecondary !== false;
        const requireAdmin = body?.requireAdmin === true;
        const normalizedReason = reason.toLowerCase();
        const isUploadRefresh =
            normalizedReason === 'upload' ||
            normalizedReason === 'bulk_insert' ||
            normalizedReason.startsWith('upload:') ||
            normalizedReason.startsWith('bulk_insert:');

        if (requireAdmin && !hasElevatedRole(auth.profile)) {
            return NextResponse.json({ success: false, error: 'Apenas administradores podem executar esta atualizacao.' }, { status: 403 });
        }

        const admin = createServiceRoleClient();
        const incrementalResult: unknown = null;
        const incrementalError: string | null = null;
        let incrementalSucceeded = !isUploadRefresh;
        let incrementalWorkerResult: unknown = null;
        let incrementalWorkerError: string | null = null;
        let staleCleanupResult: unknown = null;
        let queueState: unknown = null;

        if (isUploadRefresh) {
            const { data: stateBefore } = await admin.rpc('get_mv_refresh_queue_state');
            const pendingBefore = Number((stateBefore as QueueStatePayload | null)?.incremental_pending_count || 0);
            incrementalSucceeded = true;

            const { data: workerData, error: workerError } = await admin.rpc('ensure_incremental_refresh_worker_scheduled');
            incrementalWorkerResult = workerData ?? null;
            incrementalWorkerError = workerError?.message || null;

            const pendingIncrementals = Math.max(
                pendingBefore,
                Number((workerData as { pending_count?: number } | null)?.pending_count || 0)
            );
            if (incrementalWorkerError && pendingIncrementals > 0) {
                throw new Error(incrementalWorkerError);
            }

            const { data: cleanupData } = await admin.rpc('clear_stale_full_mv_refresh_flags');
            staleCleanupResult = cleanupData ?? null;

            const { data: stateData } = await admin.rpc('get_mv_refresh_queue_state');
            queueState = stateData ?? null;

            return NextResponse.json({
                success: true,
                queued: false,
                incremental_mode: true,
                incremental_result: incrementalResult,
                incremental_error: incrementalError,
                incremental_succeeded: incrementalSucceeded,
                incremental_worker_result: incrementalWorkerResult,
                incremental_worker_error: incrementalWorkerError,
                stale_cleanup_result: staleCleanupResult,
                queue_state: queueState,
                queue_reason: reason,
                queue_result: null,
                worker_result: null,
                pending: []
            });
        }

        const queueReason = reason;
        const { data: queueResult, error: queueError } = await admin.rpc('enqueue_mv_refresh', {
            include_secondary: includeSecondary,
            reason: queueReason
        });

        if (queueError) {
            throw new Error(queueError.message || 'Falha ao enfileirar atualizacao.');
        }

        const pending = await fetchPendingMVs(admin);
        const { data: stateData } = await admin.rpc('get_mv_refresh_queue_state');
        queueState = stateData ?? null;

        return NextResponse.json({
            success: true,
            queued: true,
            incremental_result: incrementalResult,
            incremental_error: incrementalError,
            incremental_succeeded: incrementalSucceeded,
            queue_reason: queueReason,
            queue_result: queueResult,
            worker_result: queueResult?.worker_result ?? null,
            queue_state: queueState,
            pending
        });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao enfileirar atualizacao.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
