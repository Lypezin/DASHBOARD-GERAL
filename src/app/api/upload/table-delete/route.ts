import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import {
    loadCurrentUserProfile,
    resolveAuthorizedOrganizationId,
} from '@/app/api/_shared/currentUserProfile';
import { isMissingRpcSignatureError } from '@/app/api/_shared/postgrestErrors';
import { readJsonBody } from '@/app/api/_shared/requestBody';

export const runtime = 'nodejs';

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

        const body = await readJsonBody<DeleteRequestBody>(request);

        if (!isAllowedTable(body?.table)) {
            return NextResponse.json({ success: false, error: 'Tabela nao permitida para limpeza interna.' }, { status: 400 });
        }

        const organizationAccess = resolveAuthorizedOrganizationId(auth.profile, body.organizationId, {
            invalid: 'Organizacao invalida para limpeza.',
            forbidden: 'Organizacao nao permitida para este usuario.',
        });
        if ('failure' in organizationAccess) {
            return NextResponse.json(
                { success: false, error: organizationAccess.failure.message },
                { status: organizationAccess.failure.status }
            );
        }

        const admin = createServiceRoleClient();
        const { rpcName } = TABLE_CONFIG[body.table];

        if (rpcName) {
            const { data, error } = await admin.rpc(rpcName, { p_organization_id: organizationAccess.organizationId });

            if (error && !isMissingRpcSignatureError(error)) {
                return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
            }

            if (!error) {
                return NextResponse.json({ success: true, deleted: Number(data || 0) });
            }
        }

        const deleted = await deleteInBatches(body.table, organizationAccess.organizationId);
        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro desconhecido na limpeza.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
