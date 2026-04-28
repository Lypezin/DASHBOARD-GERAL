import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';
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

        if (requireAdmin && !canRefresh(auth.profile)) {
            return NextResponse.json({ success: false, error: 'Apenas administradores podem executar esta atualizacao.' }, { status: 403 });
        }

        const admin = createServiceRoleClient();
        const { data: queueResult, error: queueError } = await admin.rpc('enqueue_mv_refresh', {
            include_secondary: includeSecondary,
            reason
        });

        if (queueError) {
            throw new Error(queueError.message || 'Falha ao enfileirar atualizacao.');
        }

        const pending = await fetchPendingMVs(admin);

        return NextResponse.json({
            success: true,
            queued: true,
            queue_result: queueResult,
            pending
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao enfileirar atualizacao.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
