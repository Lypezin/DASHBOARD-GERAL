import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import type { PendingMV } from '@/types/upload';

export const runtime = 'nodejs';

type CurrentUserProfile = {
    role?: string;
    is_admin?: boolean;
    is_approved?: boolean;
};

function normalizeProfile(profile: unknown): CurrentUserProfile | null {
    if (Array.isArray(profile)) {
        return (profile[0] as CurrentUserProfile) || null;
    }

    return (profile as CurrentUserProfile) || null;
}

function canRefresh(profile: CurrentUserProfile) {
    const role = String(profile.role || '').toLowerCase();
    return profile.is_admin === true || role === 'admin' || role === 'master';
}

async function requireApprovedUser() {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
        return { error: NextResponse.json({ success: false, error: 'Usuario nao autenticado.' }, { status: 401 }) };
    }

    const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');
    const profile = normalizeProfile(profileData);

    if (profileError || !profile || profile.is_approved !== true) {
        return { error: NextResponse.json({ success: false, error: 'Usuario nao aprovado.' }, { status: 403 }) };
    }

    return { profile };
}

async function fetchPendingMVs(admin = createServiceRoleClient()) {
    const { data, error } = await admin.rpc('get_pending_mvs');

    if (error) {
        throw new Error(error.message || 'Falha ao consultar MVs pendentes.');
    }

    return (Array.isArray(data) ? data : []) as PendingMV[];
}

export async function GET() {
    try {
        const auth = await requireApprovedUser();
        if ('error' in auth) return auth.error;

        const pending = await fetchPendingMVs();
        return NextResponse.json({ success: true, pending });
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

        if (requireAdmin && !canRefresh(auth.profile)) {
            return NextResponse.json({ success: false, error: 'Apenas administradores podem executar esta atualizacao.' }, { status: 403 });
        }

        const admin = createServiceRoleClient();
        let incrementalResult: unknown = null;
        let incrementalError: string | null = null;
        let incrementalSucceeded = !isUploadRefresh;
        let incrementalWorkerResult: unknown = null;
        let incrementalWorkerError: string | null = null;
        let staleCleanupResult: unknown = null;
        let queueState: unknown = null;

        if (isUploadRefresh) {
            const { data, error } = await admin.rpc('process_incremental_refresh_impacts', {
                p_limit: 100,
                p_include_corridas: false
            });

            incrementalResult = data ?? null;
            incrementalError = error?.message || null;
            incrementalSucceeded = !incrementalError && (data as { success?: boolean } | null)?.success !== false;

            if (!incrementalSucceeded) {
                throw new Error(incrementalError || 'Falha ao aplicar atualizacao incremental pos-upload.');
            }

            const { data: workerData, error: workerError } = await admin.rpc('ensure_incremental_refresh_worker_scheduled');
            incrementalWorkerResult = workerData ?? null;
            incrementalWorkerError = workerError?.message || null;

            const pendingIncrementals = (workerData as { pending_count?: number } | null)?.pending_count ?? 0;
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
