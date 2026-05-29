import { NextResponse } from 'next/server';
import {
    hasElevatedRole,
    loadCurrentUserProfile,
} from '@/app/api/_shared/currentUserProfile';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError,
} from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UTR_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_turno', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const ENTREGADORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados', 'p_search'] as const;
const VALORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const VALORES_DETALHADOS_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_limit', 'p_offset'] as const;

type DashboardDataMode = 'utr' | 'entregadores' | 'valores' | 'valores_detalhados' | 'valores_breakdown' | 'resumo_local';

type DashboardDataRequest = {
    mode?: unknown;
    payload?: unknown;
};

function normalizeMode(value: unknown): DashboardDataMode | null {
    if (
        value === 'utr'
        || value === 'entregadores'
        || value === 'valores'
        || value === 'valores_detalhados'
        || value === 'valores_breakdown'
        || value === 'resumo_local'
    ) {
        return value;
    }

    return null;
}

function asObject(value: unknown) {
    return value && typeof value === 'object'
        ? value as Record<string, unknown>
        : {};
}

function pickPayload(source: Record<string, unknown>, allowedKeys: readonly string[]) {
    const payload: Record<string, unknown> = {};

    for (const key of allowedKeys) {
        const value = source[key];
        if (value !== null && value !== undefined && value !== '') {
            payload[key] = value;
        }
    }

    return payload;
}

function normalizePositiveInteger(value: unknown, fallback: number, max: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return Math.min(Math.trunc(parsed), max);
}

function normalizePracas(value: unknown) {
    if (!Array.isArray(value)) return null;

    const normalized = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 50);

    return normalized.length > 0 ? normalized : null;
}

function resolveOrganizationId(payload: Record<string, unknown>, profileOrganizationId: string | null) {
    const requestedOrganizationId =
        typeof payload.p_organization_id === 'string' && UUID_RE.test(payload.p_organization_id)
            ? payload.p_organization_id
            : null;

    return requestedOrganizationId || profileOrganizationId;
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
        const profileOrganizationId = auth.profile.organization_id || null;
        const admin = createServiceRoleClient();

        if (mode === 'resumo_local') {
            const organizationId = resolveOrganizationId(source, profileOrganizationId);

            if (!organizationId || !UUID_RE.test(organizationId)) {
                return NextResponse.json({ data: null, error: 'Organizacao invalida para resumo semanal.' }, { status: 400 });
            }

            if (!hasElevatedRole(auth.profile)) {
                if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                    return NextResponse.json({ data: null, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
                }
            }

            const year = Number(source.p_ano);
            if (!Number.isFinite(year) || year < 2020 || year > 2100) {
                return NextResponse.json({ data: null, error: 'Ano invalido para resumo semanal.' }, { status: 400 });
            }

            const params = {
                p_ano: Math.trunc(year),
                p_organization_id: organizationId,
                p_pracas: normalizePracas(source.p_pracas),
            };

            const [driversResult, pedidosResult] = await Promise.all([
                admin.rpc('resumo_semanal_drivers', params),
                admin.rpc('resumo_semanal_pedidos', params),
            ]);

            if (driversResult.error || pedidosResult.error) {
                const errorMessage = driversResult.error?.message || pedidosResult.error?.message || 'Erro ao consultar resumo semanal.';
                return NextResponse.json({
                    data: null,
                    error: errorMessage,
                    details: {
                        drivers: driversResult.error || null,
                        pedidos: pedidosResult.error || null,
                    },
                }, { status: 500 });
            }

            return NextResponse.json({
                data: {
                    drivers: Array.isArray(driversResult.data) ? driversResult.data : [],
                    pedidos: Array.isArray(pedidosResult.data) ? pedidosResult.data : [],
                },
                error: null,
            });
        }

        const allowedParams = mode === 'utr'
            ? UTR_ALLOWED_PARAMS
            : mode === 'entregadores'
                ? ENTREGADORES_ALLOWED_PARAMS
            : mode === 'valores_detalhados'
                ? VALORES_DETALHADOS_ALLOWED_PARAMS
                : VALORES_ALLOWED_PARAMS;
        const payload = pickPayload(source, allowedParams);
        const organizationId = resolveOrganizationId(payload, profileOrganizationId);

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ data: null, error: 'Organizacao invalida para consulta.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile)) {
            if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                return NextResponse.json({ data: null, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
            }
        }

        payload.p_organization_id = organizationId;

        if (mode === 'valores_detalhados') {
            payload.p_limit = normalizePositiveInteger(payload.p_limit, 25, 200);
            payload.p_offset = normalizePositiveInteger(payload.p_offset, 0, 100000);
        }

        const rpcName = mode === 'utr'
            ? 'calcular_utr_completo'
            : mode === 'entregadores'
                ? 'listar_entregadores_v2'
            : mode === 'valores'
                ? 'listar_valores_entregadores'
                : mode === 'valores_detalhados'
                    ? 'listar_valores_entregadores_detalhado'
                    : 'obter_resumo_valores_breakdown';

        const { data, error } = await admin.rpc(rpcName, payload);

        if (error) {
            return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ data: data ?? null, error: null });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao consultar dados do dashboard.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
