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

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
        }
        const { profile } = auth;

        const body = await request.json().catch(() => null);
        const rawRows = body?.dados;
        const requestedOrganizationId = body?.organizationId;

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Nenhum dado recebido para importacao.' }, { status: 400 });
        }

        const profileOrganizationId = profile.organization_id || null;
        const organizationId =
            typeof requestedOrganizationId === 'string' && UUID_RE.test(requestedOrganizationId)
                ? requestedOrganizationId
                : profileOrganizationId;

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao invalida para importacao.' }, { status: 400 });
        }

        if (!hasElevatedRole(profile) && profileOrganizationId && organizationId !== profileOrganizationId) {
            return NextResponse.json({ success: false, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
        }

        const rows = rawRows.map((row) => ({
            ...(row && typeof row === 'object' ? row : {}),
            organization_id: organizationId
        }));

        const admin = createServiceRoleClient();
        const { data, error } = await admin.rpc('insert_dados_corridas_batch', { dados: rows });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message, details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data || { success: true, inserted: rows.length, errors: 0 });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro desconhecido no upload.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
