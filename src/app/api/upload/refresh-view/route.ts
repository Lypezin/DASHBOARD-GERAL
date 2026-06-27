import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { readJsonBody } from '@/app/api/_shared/requestBody';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError,
} from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const TABLE_TO_REFRESH_RPC = {
    dados_marketing: 'refresh_mv_entregadores_marketing',
} as const;

type RefreshRequestBody = {
    table?: unknown;
};

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ success: false, error: auth.failure.message }, { status: auth.failure.status });
        }

        const body = await readJsonBody<RefreshRequestBody>(request);
        const table = typeof body?.table === 'string' ? body.table : null;
        const refreshRpcFunction = table && table in TABLE_TO_REFRESH_RPC
            ? TABLE_TO_REFRESH_RPC[table as keyof typeof TABLE_TO_REFRESH_RPC]
            : null;

        if (!refreshRpcFunction) {
            return NextResponse.json({ success: false, error: 'Refresh nao permitido.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const { data, error } = await admin.rpc(refreshRpcFunction);

        if (error) {
            return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json(data || { success: true, view: refreshRpcFunction });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            return NextResponse.json(getServiceRoleConfigErrorPayload(), { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao atualizar view materializada.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
