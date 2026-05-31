import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

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
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as DetailBody | null;
    const entregadorId = normalizeString(body?.entregadorId, 120);
    const requestedOrganizationId = normalizeString(body?.organizationId, 120);
    const organizationId = hasElevatedRole(auth.profile)
        ? requestedOrganizationId || auth.profile.organization_id || null
        : auth.profile.organization_id || null;

    if (!entregadorId) {
        return NextResponse.json({ data: null, error: 'Entregador invalido para consulta.' }, { status: 400 });
    }

    if (!organizationId) {
        return NextResponse.json({ data: null, error: 'Organizacao invalida para consulta.' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('get_entregador_detail', {
        p_entregador_id: entregadorId,
        p_org_id: organizationId,
    });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? null, error: null });
}
