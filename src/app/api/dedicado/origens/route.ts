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
import {
    buildDedicadoFilterPayload,
    omitPayloadKeys,
    shouldFallbackOnLegacySummary,
    shouldFallbackOnMissingFunction,
} from '@/components/views/dedicado/rpcFallback';
import { createRequestKey } from '@/utils/request/createRequestKey';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEDICADO_CACHE_TTL_MS = 60_000;
const DEDICADO_DETAIL_CACHE_TTL_MS = 20_000;
const MAX_DEDICADO_CACHE_ENTRIES = 100;

type DedicadoMode = 'summary' | 'entregadores' | 'entregador';

type DedicadoApiRequest = {
    mode?: unknown;
    payload?: unknown;
};

type RpcErrorLike = {
    code?: string | null;
    message?: string | null;
} | null | undefined;

type DedicadoCacheEntry = {
    data: unknown;
    expiresAt: number;
};

const dedicadoCache = new Map<string, DedicadoCacheEntry>();
const inFlightDedicado = new Map<string, Promise<unknown>>();

function normalizeMode(value: unknown): DedicadoMode | null {
    if (value === 'summary' || value === 'entregadores' || value === 'entregador') {
        return value;
    }

    return null;
}

function getDedicadoCacheKey(mode: DedicadoMode, payload: Record<string, unknown>, profileId?: string) {
    return createRequestKey({
        mode,
        payload,
        profileId: profileId || null,
    });
}

function cleanupDedicadoCache(now: number) {
    if (dedicadoCache.size <= MAX_DEDICADO_CACHE_ENTRIES) return;

    let removed = 0;
    for (const [key, value] of dedicadoCache.entries()) {
        if (removed >= 20) break;
        if (value.expiresAt <= now) {
            dedicadoCache.delete(key);
            removed++;
        }
    }

    while (dedicadoCache.size > MAX_DEDICADO_CACHE_ENTRIES) {
        const oldestKey = dedicadoCache.keys().next().value as string | undefined;
        if (!oldestKey) break;
        dedicadoCache.delete(oldestKey);
    }
}

async function resolveDedicadoWithCache(
    mode: DedicadoMode,
    payload: Record<string, unknown>,
    profileId: string | undefined,
    fetcher: () => Promise<unknown>,
) {
    const cacheKey = getDedicadoCacheKey(mode, payload, profileId);
    const now = Date.now();
    const cached = dedicadoCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        return { data: cached.data, cached: true };
    }

    if (cached) {
        dedicadoCache.delete(cacheKey);
    }

    cleanupDedicadoCache(now);

    const existingRequest = inFlightDedicado.get(cacheKey);
    if (existingRequest) {
        return { data: await existingRequest, cached: true };
    }

    const request = fetcher();
    inFlightDedicado.set(cacheKey, request);

    try {
        const data = await request;
        dedicadoCache.set(cacheKey, {
            data,
            expiresAt: Date.now() + (mode === 'entregador' ? DEDICADO_DETAIL_CACHE_TTL_MS : DEDICADO_CACHE_TTL_MS),
        });
        return { data, cached: false };
    } finally {
        inFlightDedicado.delete(cacheKey);
    }
}

function normalizePayload(mode: DedicadoMode, rawPayload: unknown) {
    const source = rawPayload && typeof rawPayload === 'object'
        ? rawPayload as Record<string, unknown>
        : {};

    const extraPayload: Record<string, unknown> = {};

    if (mode === 'summary' && typeof source.p_include_dia_origem === 'boolean') {
        extraPayload.p_include_dia_origem = source.p_include_dia_origem;
    }

    if (mode === 'entregador' && typeof source.p_entregador_id === 'string' && source.p_entregador_id.trim()) {
        extraPayload.p_entregador_id = source.p_entregador_id.trim();
    }

    return buildDedicadoFilterPayload(source, extraPayload);
}

function shouldFallbackOnDedicadoEntregadores(error: RpcErrorLike, primaryName: string) {
    const errorMessage = String(error?.message || '');

    return (
        shouldFallbackOnMissingFunction(error, primaryName)
        || error?.code === '57014'
        || error?.code === 'TIMEOUT'
        || errorMessage.includes('timeout')
        || errorMessage.includes('internal server error')
    );
}

async function executeRpcWithFallback<T>(
    rpcName: string,
    payload: Record<string, unknown>,
    options: {
        fallbackName?: string;
        prepareFallbackPayload?: (requestPayload: Record<string, unknown>) => Record<string, unknown>;
        shouldFallback?: (error: RpcErrorLike) => boolean;
    } = {}
) {
    const admin = createServiceRoleClient();
    let result = await admin.rpc(rpcName, payload);

    if (!options.fallbackName || !result.error || !options.shouldFallback?.(result.error)) {
        return result as { data: T | null; error: RpcErrorLike };
    }

    const fallbackPayload = options.prepareFallbackPayload
        ? options.prepareFallbackPayload(payload)
        : payload;

    result = await admin.rpc(options.fallbackName, fallbackPayload);
    return result as { data: T | null; error: RpcErrorLike };
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

        const body = await request.json().catch(() => null) as DedicadoApiRequest | null;
        const mode = normalizeMode(body?.mode);

        if (!mode) {
            return NextResponse.json({ data: null, error: 'Modo de consulta do DEDICADO inválido.' }, { status: 400 });
        }

        const payload = normalizePayload(mode, body?.payload);
        const profileOrganizationId = auth.profile.organization_id || null;
        const requestedOrganizationId =
            typeof payload.p_organization_id === 'string' && UUID_RE.test(payload.p_organization_id)
                ? payload.p_organization_id
                : null;
        const organizationId = requestedOrganizationId || profileOrganizationId;

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ data: null, error: 'Organização inválida para consulta do DEDICADO.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile)) {
            if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                return NextResponse.json({ data: null, error: 'Organização não permitida para este usuário.' }, { status: 403 });
            }
        }

        payload.p_organization_id = organizationId;

        if (mode === 'entregador') {
            const entregadorId = typeof payload.p_entregador_id === 'string' ? payload.p_entregador_id.trim() : '';
            if (!entregadorId) {
                return NextResponse.json({ data: null, error: 'Entregador inválido para detalhamento.' }, { status: 400 });
            }
        }

        const { data, cached } = await resolveDedicadoWithCache(mode, payload, auth.profile.id, async () => {
            const result = mode === 'summary'
                ? await executeRpcWithFallback(
                    'dashboard_dedicado_origens_v2',
                    payload,
                    {
                        fallbackName: payload.p_include_dia_origem === true ? undefined : 'dashboard_dedicado_origens',
                        shouldFallback: (error) => shouldFallbackOnLegacySummary(error, 'dashboard_dedicado_origens_v2'),
                        prepareFallbackPayload: (requestPayload) => omitPayloadKeys(requestPayload, ['p_semanas', 'p_include_dia_origem']),
                    }
                )
                : mode === 'entregadores'
                    ? await executeRpcWithFallback(
                        'listar_entregadores_origens_v2',
                        payload,
                        {
                            fallbackName: 'listar_entregadores_origens',
                            shouldFallback: (error) => shouldFallbackOnDedicadoEntregadores(error, 'listar_entregadores_origens_v2'),
                            prepareFallbackPayload: (requestPayload) => omitPayloadKeys(requestPayload, ['p_semanas']),
                        }
                    )
                    : await executeRpcWithFallback(
                        'dedicado_entregador_origens_v2',
                        payload,
                        {
                            fallbackName: 'dedicado_entregador_origens',
                            shouldFallback: (error) => shouldFallbackOnMissingFunction(error, 'dedicado_entregador_origens_v2'),
                            prepareFallbackPayload: (requestPayload) => omitPayloadKeys(requestPayload, ['p_semanas']),
                        }
                    );

            if (result.error) {
                throw new Error(result.error.message || 'Erro ao consultar DEDICADO.');
            }

            return result.data ?? null;
        });

        return NextResponse.json({ data, error: null, cached });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao consultar dados do DEDICADO.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
