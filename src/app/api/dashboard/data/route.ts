import { NextResponse } from 'next/server';
import {
    loadCurrentUserProfile,
    resolveAuthorizedOrganizationId,
} from '@/app/api/_shared/currentUserProfile';
import {
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import {
    normalizeMode,
    asObject,
    resolveOrganizationId,
    fetchDashboardData,
} from '@/services/dashboardService';

export const runtime = 'nodejs';

type DashboardDataRequest = {
    mode?: unknown;
    payload?: unknown;
};

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuario ainda nao aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
        }

        const body = await request.json().catch(() => null) as DashboardDataRequest | null;
        const mode = normalizeMode(body?.mode);

        if (!mode) {
            return NextResponse.json({ data: null, error: 'Modo de dados do dashboard invalido.' }, { status: 400 });
        }

        const source = asObject(body?.payload);
        const organizationAccess = resolveAuthorizedOrganizationId(
            auth.profile,
            resolveOrganizationId(source, auth.profile.organization_id || null),
            {
                invalid: 'Organizacao invalida para consulta.',
                forbidden: 'Organizacao nao permitida para este usuario.',
            }
        );

        if ('failure' in organizationAccess) {
            return NextResponse.json({ data: null, error: organizationAccess.failure.message }, { status: organizationAccess.failure.status });
        }

        const { data, cached } = await fetchDashboardData(mode, source, organizationAccess.organizationId);

        return NextResponse.json({ data, error: null, cached });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao consultar dados do dashboard.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
