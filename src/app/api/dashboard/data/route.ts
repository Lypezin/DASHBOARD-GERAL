import { NextResponse } from 'next/server';
import {
    hasElevatedRole,
    loadCurrentUserProfile,
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DashboardDataRequest = {
    mode?: unknown;
    payload?: unknown;
};

export async function POST(request: Request) {
    try {
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            notApprovedMessage: 'Usuário ainda não aprovado.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
        }

        const body = await request.json().catch(() => null) as DashboardDataRequest | null;
        const mode = normalizeMode(body?.mode);

        if (!mode) {
            return NextResponse.json({ data: null, error: 'Modo de dados do dashboard inválido.' }, { status: 400 });
        }

        const source = asObject(body?.payload);
        const profileOrganizationId = auth.profile.organization_id || null;
        
        const organizationId = resolveOrganizationId(source, profileOrganizationId);
        
        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ data: null, error: 'Organização inválida para consulta.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile)) {
            if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                return NextResponse.json({ data: null, error: 'Organização não permitida para este usuário.' }, { status: 403 });
            }
        }

        const { data, cached } = await fetchDashboardData(mode, source, organizationId);

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
