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
const DELETE_BATCH_SIZE = 500;

const TABLE_CONFIG = {
    dados_marketing: {
        rpcName: 'delete_all_dados_marketing',
    },
    dados_valores_cidade: {
        rpcName: 'delete_all_dados_valores_cidade',
    },
} as const;

type AllowedTable = keyof typeof TABLE_CONFIG;

type DeleteRequestBody = {
    table?: unknown;
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

async function deleteInBatches(table: AllowedTable, organizationId: string) {
    const admin = createServiceRoleClient();
    let deletedCount = 0;

    while (true) {
        const { data, error } = await admin
            .from(table)
            .select('id')
            .eq('organization_id', organizationId)
            .limit(DELETE_BATCH_SIZE);

        if (error) {
            throw new Error(`Erro ao buscar lote para exclusao: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return deletedCount;
        }

        const ids = data
            .map((row) => row.id)
            .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number');

        if (ids.length === 0) {
            return deletedCount;
        }

        const { error: deleteError } = await admin.from(table).delete().in('id', ids);

        if (deleteError) {
            throw new Error(`Erro ao excluir lote: ${deleteError.message}`);
        }

        deletedCount += ids.length;

        if (data.length < DELETE_BATCH_SIZE) {
            return deletedCount;
        }
    }
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

        const body = await request.json().catch(() => null) as DeleteRequestBody | null;

        if (!isAllowedTable(body?.table)) {
            return NextResponse.json({ success: false, error: 'Tabela nao permitida para limpeza interna.' }, { status: 400 });
        }

        const profileOrganizationId = auth.profile.organization_id || null;
        const requestedOrganizationId =
            typeof body?.organizationId === 'string' && UUID_RE.test(body.organizationId)
                ? body.organizationId
                : null;
        const organizationId = requestedOrganizationId || profileOrganizationId;

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao invalida para limpeza.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile) && (!profileOrganizationId || organizationId !== profileOrganizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
        }

        const admin = createServiceRoleClient();
        const { rpcName } = TABLE_CONFIG[body.table];

        if (rpcName) {
            const { data, error } = await admin.rpc(rpcName, { p_organization_id: organizationId });

            if (error && !isMissingRpcSignatureError(error)) {
                return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
            }

            if (!error) {
                return NextResponse.json({ success: true, deleted: Number(data || 0) });
            }
        }

        const deleted = await deleteInBatches(body.table, organizationId);
        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro desconhecido na limpeza.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
