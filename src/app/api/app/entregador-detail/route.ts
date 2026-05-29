import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

type DetailBody = {
    entregadorId?: unknown;
    organizationId?: unknown;
};

function normalizeString(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as DetailBody | null;
    const entregadorId = normalizeString(body?.entregadorId, 120);
    const organizationId = normalizeString(body?.organizationId, 120);

    if (!entregadorId) {
        return NextResponse.json({ data: null, error: 'Entregador invalido para consulta.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_entregador_detail', {
        p_entregador_id: entregadorId,
        p_org_id: organizationId,
    });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? null, error: null });
}
