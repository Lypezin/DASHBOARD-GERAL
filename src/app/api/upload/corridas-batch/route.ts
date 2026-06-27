import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import {
    loadCurrentUserProfile,
    resolveAuthorizedOrganizationId,
} from '@/app/api/_shared/currentUserProfile';
import { readJsonBody } from '@/app/api/_shared/requestBody';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
        }
        const body = await readJsonBody<{ dados?: unknown; organizationId?: unknown }>(request);
        const rawRows = body?.dados;

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Nenhum dado recebido para importacao.' }, { status: 400 });
        }

        const organizationAccess = resolveAuthorizedOrganizationId(auth.profile, body?.organizationId, {
            invalid: 'Organizacao invalida para importacao.',
            forbidden: 'Organizacao nao permitida para este usuario.',
        });
        if ('failure' in organizationAccess) {
            return NextResponse.json(
                { success: false, error: organizationAccess.failure.message },
                { status: organizationAccess.failure.status }
            );
        }

        const rows = rawRows.map((row) => ({
            ...(row && typeof row === 'object' ? row : {}),
            organization_id: organizationAccess.organizationId
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
