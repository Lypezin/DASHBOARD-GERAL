import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import {
    hasElevatedRole,
    loadCurrentUserProfile,
} from '@/app/api/_shared/currentUserProfile';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TABLE_CONFIG = {
    dados_marketing: {
        rpcName: 'insert_dados_marketing_batch',
    },
    dados_valores_cidade: {
        rpcName: null,
    },
} as const;

type AllowedTable = keyof typeof TABLE_CONFIG;

type BatchRequestBody = {
    table?: unknown;
    rows?: unknown;
    organizationId?: unknown;
};

function isAllowedTable(value: unknown): value is AllowedTable {
    return typeof value === 'string' && value in TABLE_CONFIG;
}

function isMissingRpcSignatureError(error: unknown) {
    if (!error || typeof error !== 'object') return false;

    const maybeError = error as { code?: string; message?: string };
    return (
        maybeError.code === 'PGRST116' ||
        maybeError.code === 'PGRST202' ||
        maybeError.message?.toLowerCase().includes('could not find the function') === true
    );
}

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
        }

        const body = await request.json().catch(() => null) as BatchRequestBody | null;

        if (!isAllowedTable(body?.table)) {
            return NextResponse.json({ success: false, error: 'Tabela nao permitida para upload interno.' }, { status: 400 });
        }

        if (!Array.isArray(body?.rows) || body.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Nenhum dado recebido para importacao.' }, { status: 400 });
        }

        const profileOrganizationId = auth.profile.organization_id || null;
        const requestedOrganizationId =
            typeof body.organizationId === 'string' && UUID_RE.test(body.organizationId)
                ? body.organizationId
                : null;
        const organizationId = requestedOrganizationId || profileOrganizationId;

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao invalida para importacao.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile) && (!profileOrganizationId || organizationId !== profileOrganizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
        }

        const rows = body.rows.map((row) => ({
            ...(row && typeof row === 'object' ? row : {}),
            organization_id: organizationId,
        }));

        const admin = createServiceRoleClient();
        const { rpcName } = TABLE_CONFIG[body.table];

        if (rpcName) {
            const { data, error } = await admin.rpc(rpcName, { dados: rows });

            if (error && !isMissingRpcSignatureError(error)) {
                return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
            }

            if (!error) {
                return NextResponse.json(data || { success: true, inserted: rows.length, errors: 0 });
            }
        }

        const { error } = await admin.from(body.table).insert(rows as never[]);

        if (error) {
            return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, inserted: rows.length, errors: 0 });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro desconhecido no upload.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
