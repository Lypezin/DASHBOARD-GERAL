import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

type ActivityBody = {
    sessionId?: unknown;
    actionType?: unknown;
    description?: unknown;
    tabName?: unknown;
    filtersApplied?: unknown;
};

function normalizeString(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as ActivityBody | null;
    const sessionId = normalizeString(body?.sessionId, 120);
    const actionType = normalizeString(body?.actionType, 80);
    const description = normalizeString(body?.description, 500);
    const tabName = normalizeString(body?.tabName, 80);
    const filtersApplied =
        body?.filtersApplied && typeof body.filtersApplied === 'object'
            ? body.filtersApplied
            : null;

    if (!sessionId || !actionType) {
        return NextResponse.json({ success: false, error: 'Payload invalido para atividade.' }, { status: 400 });
    }

    if (sessionId !== auth.user.id) {
        return NextResponse.json({ success: false, error: 'Sessao nao permitida para este usuario.' }, { status: 403 });
    }

    const supabase = createClient();
    const { error } = await supabase.rpc('registrar_atividade', {
        p_session_id: sessionId,
        p_action_type: actionType,
        p_action_details: description,
        p_tab_name: tabName,
        p_filters_applied: filtersApplied,
    });

    if (error) {
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
