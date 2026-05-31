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
import { createRequestKey } from '@/utils/request/createRequestKey';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UTR_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_turno', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const ENTREGADORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados', 'p_search'] as const;
const VALORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const VALORES_DETALHADOS_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_limit', 'p_offset'] as const;
const CACHE_TTL_BY_MODE_MS: Record<DashboardDataMode, number> = {
    utr: 90_000,
    entregadores: 90_000,
    valores: 90_000,
    valores_detalhados: 30_000,
    valores_breakdown: 90_000,
    resumo_local: 90_000,
};
const MAX_CACHE_ENTRIES = 120;

type DashboardDataMode = 'utr' | 'entregadores' | 'valores' | 'valores_detalhados' | 'valores_breakdown' | 'resumo_local';

type DashboardDataRequest = {
    mode?: unknown;
    payload?: unknown;
};

type DashboardDataCacheEntry = {
    data: unknown;
    expiresAt: number;
};

const dashboardDataCache = new Map<string, DashboardDataCacheEntry>();
const inFlightDashboardData = new Map<string, Promise<unknown>>();

function getCacheKey(mode: DashboardDataMode, payload: Record<string, unknown>) {
    return createRequestKey({ mode, payload });
}

function getCachedData(cacheKey: string) {
    const entry = dashboardDataCache.get(cacheKey);
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
        return entry.data;
    }

    if (entry) {
        dashboardDataCache.delete(cacheKey);
    }

    if (dashboardDataCache.size > MAX_CACHE_ENTRIES) {
        let removed = 0;
        for (const [key, value] of dashboardDataCache.entries()) {
            if (removed >= 20) break;
            if (value.expiresAt <= now) {
                dashboardDataCache.delete(key);
                removed++;
            }
        }

        while (dashboardDataCache.size > MAX_CACHE_ENTRIES) {
            const oldestKey = dashboardDataCache.keys().next().value as string | undefined;
            if (!oldestKey) break;
            dashboardDataCache.delete(oldestKey);
        }
    }

    return null;
}

function setCachedData(cacheKey: string, mode: DashboardDataMode, data: unknown) {
    dashboardDataCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL_BY_MODE_MS[mode],
    });
}

async function resolveWithCache(
    mode: DashboardDataMode,
    payload: Record<string, unknown>,
    fetcher: () => Promise<unknown>,
) {
    const cacheKey = getCacheKey(mode, payload);
    const cached = getCachedData(cacheKey);

    if (cached !== null) {
        return { data: cached, cached: true };
    }

    const existingRequest = inFlightDashboardData.get(cacheKey);
    if (existingRequest) {
        return { data: await existingRequest, cached: true };
    }

    const request = fetcher();
    inFlightDashboardData.set(cacheKey, request);

    try {
        const data = await request;
        setCachedData(cacheKey, mode, data);
        return { data, cached: false };
    } finally {
        inFlightDashboardData.delete(cacheKey);
    }
}

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
        const admin = createServiceRoleClient();

        if (mode === 'resumo_local') {
            const organizationId = resolveOrganizationId(source, profileOrganizationId);

            if (!organizationId || !UUID_RE.test(organizationId)) {
                return NextResponse.json({ data: null, error: 'Organização inválida para resumo semanal.' }, { status: 400 });
            }

            if (!hasElevatedRole(auth.profile)) {
                if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                    return NextResponse.json({ data: null, error: 'Organização não permitida para este usuário.' }, { status: 403 });
                }
            }

            const year = Number(source.p_ano);
            if (!Number.isFinite(year) || year < 2020 || year > 2100) {
                return NextResponse.json({ data: null, error: 'Ano inválido para resumo semanal.' }, { status: 400 });
            }

            const params = {
                p_ano: Math.trunc(year),
                p_organization_id: organizationId,
                p_pracas: normalizePracas(source.p_pracas),
            };

            const { data, cached } = await resolveWithCache('resumo_local', params, async () => {
                const [driversResult, pedidosResult] = await Promise.all([
                    admin.rpc('resumo_semanal_drivers', params),
                    admin.rpc('resumo_semanal_pedidos', params),
                ]);

                if (driversResult.error || pedidosResult.error) {
                    const errorMessage = driversResult.error?.message || pedidosResult.error?.message || 'Erro ao consultar resumo semanal.';
                    throw new Error(errorMessage);
                }

                return {
                    drivers: Array.isArray(driversResult.data) ? driversResult.data : [],
                    pedidos: Array.isArray(pedidosResult.data) ? pedidosResult.data : [],
                };
            });

            return NextResponse.json({
                data,
                error: null,
                cached,
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
            return NextResponse.json({ data: null, error: 'Organização inválida para consulta.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile)) {
            if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                return NextResponse.json({ data: null, error: 'Organização não permitida para este usuário.' }, { status: 403 });
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

        const { data, cached } = await resolveWithCache(mode, payload, async () => {
            const { data: rpcData, error } = await admin.rpc(rpcName, payload);

            if (error) {
                throw new Error(error.message);
            }

            return rpcData ?? null;
        });

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
