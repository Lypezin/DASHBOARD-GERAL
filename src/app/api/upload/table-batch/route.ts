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

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
        }

        const body = await readJsonBody<BatchRequestBody>(request);

        if (!isAllowedTable(body?.table)) {
            return NextResponse.json({ success: false, error: 'Tabela nao permitida para upload interno.' }, { status: 400 });
        }

        if (!Array.isArray(body?.rows) || body.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Nenhum dado recebido para importacao.' }, { status: 400 });
        }

        const organizationAccess = resolveAuthorizedOrganizationId(auth.profile, body.organizationId, {
            invalid: 'Organizacao invalida para importacao.',
            forbidden: 'Organizacao nao permitida para este usuario.',
        });
        if ('failure' in organizationAccess) {
            return NextResponse.json(
                { success: false, error: organizationAccess.failure.message },
                { status: organizationAccess.failure.status }
            );
        }

        const rows = body.rows.map((row) => ({
            ...(row && typeof row === 'object' ? row : {}),
            organization_id: organizationAccess.organizationId,
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
