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

type RefreshRequestBody = {
    reason?: unknown;
    includeSecondary?: unknown;
    requireAdmin?: unknown;
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

function getQueueCount(state: QueueStatePayload | null | undefined, key: keyof QueueStatePayload, fallback = 0) {
    return Number(state?.[key] || fallback || 0);
}

function normalizeRefreshReason(value: unknown) {
    return typeof value === 'string' && value.trim()
        ? value.trim().slice(0, 80)
        : 'manual';
}

function isIncrementalRefreshReason(reason: string) {
    const normalizedReason = reason.toLowerCase();
    return (
        normalizedReason === 'upload' ||
        normalizedReason === 'bulk_insert' ||
        normalizedReason.startsWith('upload:') ||
        normalizedReason.startsWith('bulk_insert:')
    );
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

    const incrementalPending = getQueueCount(state, 'incremental_pending_count');
    const incrementalWorkerScheduled = state?.incremental_worker_scheduled === true;
    if (incrementalPending > 0 && !incrementalWorkerScheduled) {
        await admin.rpc('ensure_incremental_refresh_worker_scheduled');
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

        const body = await request.json().catch(() => ({})) as RefreshRequestBody;
        const reason = normalizeRefreshReason(body?.reason);
        const includeSecondary = body?.includeSecondary !== false;
        const requireAdmin = body?.requireAdmin === true;
        const isUploadRefresh = isIncrementalRefreshReason(reason);

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

            const stateAfterWorker = await fetchQueueState(admin);
            const pendingIncrementals = getQueueCount(stateAfterWorker, 'incremental_pending_count');

            if (incrementalWorker.error && pendingIncrementals > 0) {
                throw new Error(incrementalWorker.error);
            }

            const { data: cleanupData } = await admin.rpc('clear_stale_full_mv_refresh_flags');
            const stateData = await fetchQueueState(admin);

            return NextResponse.json({
                success: true,
                queued: false,
                incremental_mode: true,
                incremental_result: immediateResult.data,
                incremental_error: immediateResult.error,
                incremental_succeeded: immediateResult.error === null,
                incremental_worker_result: incrementalWorker.data,
                incremental_worker_error: incrementalWorker.error,
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

        const fullWorker = await tryRpc(admin, 'ensure_mv_refresh_worker_scheduled');
        const [pending, stateData] = await Promise.all([
            fetchPendingMVs(admin),
            fetchQueueState(admin),
        ]);
        const pendingFull = getQueueCount(stateData, 'full_pending_count', pending.length);

        if (fullWorker.error && pendingFull > 0) {
            throw new Error(fullWorker.error);
        }

        return NextResponse.json({
            success: true,
            queued: true,
            incremental_result: null,
            incremental_error: null,
            incremental_succeeded: true,
            queue_reason: reason,
            queue_result: queueResult,
            worker_result: fullWorker.data ?? queueResult?.worker_result ?? null,
            worker_error: fullWorker.error,
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
