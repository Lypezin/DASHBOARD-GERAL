import { NextResponse } from 'next/server';
import {
    loadCurrentUserProfile,
    resolveAuthorizedOrganizationId,
} from '@/app/api/_shared/currentUserProfile';
import { normalizeAssignedPracas } from '@/app/api/app/secure-rpc/cache';
import { hasFullCityAccess, normalizePracaKey, splitPracas, uniquePracas } from '@/app/api/app/secure-rpc/utils';
import type { CurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
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

function scopeDashboardPracas(
    mode: NonNullable<ReturnType<typeof normalizeMode>>,
    source: Record<string, unknown>,
    profile: CurrentUserProfile,
) {
    if (hasFullCityAccess(profile)) return { source };

    const assigned = uniquePracas(normalizeAssignedPracas(profile));
    if (assigned.length === 0) {
        return { error: 'Nenhuma praça foi atribuída a este usuário.' };
    }

    const allowedByKey = new Map(assigned.map((praca) => [normalizePracaKey(praca), praca]));
    const requested = uniquePracas([
        ...splitPracas(source.p_praca),
        ...splitPracas(source.p_pracas),
    ]);
    const scoped = requested.length > 0
        ? requested.map((praca) => allowedByKey.get(normalizePracaKey(praca))).filter((praca): praca is string => Boolean(praca))
        : assigned;

    if (scoped.length !== requested.length && requested.length > 0) {
        return { error: 'Praça não permitida para este usuário.' };
    }

    const nextSource = { ...source };
    if (mode === 'resumo_local') {
        nextSource.p_pracas = scoped;
        delete nextSource.p_praca;
    } else {
        // These RPCs parse comma-separated plaza filters; preserve the UI's
        // multi-selection while enforcing the profile's allowed set.
        nextSource.p_praca = scoped.join(',');
        delete nextSource.p_pracas;
    }

    return { source: nextSource };
}

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

        const plazaAccess = scopeDashboardPracas(mode, source, auth.profile);
        if ('error' in plazaAccess) {
            return NextResponse.json({ data: null, error: plazaAccess.error }, { status: 403 });
        }

        const { data, cached } = await fetchDashboardData(mode, plazaAccess.source, organizationAccess.organizationId);

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
