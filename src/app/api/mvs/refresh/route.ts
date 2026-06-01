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

type QueueStatePayload = {
    full_pending_count?: number;
    full_in_progress_count?: number;
    incremental_pending_count?: number;
    full_worker_scheduled?: boolean;
    incremental_worker_scheduled?: boolean;
};

type RpcCallResult = {
    data: unknown;
    error: string | null;
};

async function requireApprovedUser() {
    const auth = await loadCurrentUserProfile({
        requireApproved: true,
        notApprovedMessage: 'Usuário não aprovado.',
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

async function fetchQueueState(admin = createServiceRoleClient()) {
    const { data } = await admin.rpc('get_mv_refresh_queue_state');
    return (data ?? null) as QueueStatePayload | null;
}

async function tryRpc(
    admin: ReturnType<typeof createServiceRoleClient>,
    functionName: string,
    params?: Record<string, unknown>
): Promise<RpcCallResult> {
    const { data, error } = await admin.rpc(functionName, params);

    return {
        data: data ?? null,
        error: error?.message || null,
    };
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
        await admin.rpc('ensure_mv_refresh_worker_scheduled');
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

        const message = error instanceof Error ? error.message : 'Erro ao consultar fila de atualização.';
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
            return NextResponse.json({ success: false, error: 'Apenas administradores podem executar esta atualização.' }, { status: 403 });
        }

        const admin = createServiceRoleClient();

        if (isUploadRefresh) {
            const immediateResult = await tryRpc(admin, 'process_incremental_refresh_impacts', {
                p_limit: 50,
                p_include_corridas: true,
            });

            const incrementalWorker = await tryRpc(admin, 'ensure_incremental_refresh_worker_scheduled');
            const fullWorker = await tryRpc(admin, 'ensure_mv_refresh_worker_scheduled');

            const { data: stateAfterWorker } = await admin.rpc('get_mv_refresh_queue_state');
            const pendingIncrementals = Number((stateAfterWorker as QueueStatePayload | null)?.incremental_pending_count || 0);
            const pendingFull = Number((stateAfterWorker as QueueStatePayload | null)?.full_pending_count || 0);

            if (incrementalWorker.error && pendingIncrementals > 0) {
                throw new Error(incrementalWorker.error);
            }

            if (fullWorker.error && pendingFull > 0) {
                throw new Error(fullWorker.error);
            }

            const { data: cleanupData } = await admin.rpc('clear_stale_full_mv_refresh_flags');
            const { data: stateData } = await admin.rpc('get_mv_refresh_queue_state');

            return NextResponse.json({
                success: true,
                queued: false,
                incremental_mode: true,
                incremental_result: immediateResult.data,
                incremental_error: immediateResult.error,
                incremental_succeeded: immediateResult.error === null,
                incremental_worker_result: incrementalWorker.data,
                incremental_worker_error: incrementalWorker.error,
                full_worker_result: fullWorker.data,
                full_worker_error: fullWorker.error,
                stale_cleanup_result: cleanupData ?? null,
                queue_state: stateData ?? null,
                queue_reason: reason,
                queue_result: null,
                worker_result: null,
                pending: []
            });
        }

        const { data: queueResult, error: queueError } = await admin.rpc('enqueue_mv_refresh', {
            include_secondary: includeSecondary,
            reason
        });

        if (queueError) {
            throw new Error(queueError.message || 'Falha ao enfileirar atualização.');
        }

        const pending = await fetchPendingMVs(admin);
        const { data: stateData } = await admin.rpc('get_mv_refresh_queue_state');

        return NextResponse.json({
            success: true,
            queued: true,
            incremental_result: null,
            incremental_error: null,
            incremental_succeeded: true,
            queue_reason: reason,
            queue_result: queueResult,
            worker_result: queueResult?.worker_result ?? null,
            queue_state: stateData ?? null,
            pending
        });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao enfileirar atualização.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
