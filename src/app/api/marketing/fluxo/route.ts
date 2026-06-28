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
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type FluxoRequestBody = {
    dataInicial?: unknown;
    dataFinal?: unknown;
    includeNames?: unknown;
    organizationId?: unknown;
    praca?: unknown;
};

type FluxoCacheEntry = {
    data: unknown[];
    expiresAt: number;
};

const FLUXO_CACHE_TTL_MS = 5 * 60 * 1000;
const FLUXO_CACHE_MAX_ENTRIES = 80;
const fluxoCache = new Map<string, FluxoCacheEntry>();
const fluxoInFlight = new Map<string, Promise<unknown[]>>();

function normalizeDate(value: unknown) {
    return typeof value === 'string' && ISO_DATE_RE.test(value) ? value : null;
}

function normalizePraca(value: unknown) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 120) : null;
}

function buildFluxoCacheKey(params: {
    dataInicial: string;
    dataFinal: string;
    includeNames: boolean;
    organizationId: string;
    praca: string | null;
}) {
    return [
        params.organizationId,
        params.dataInicial,
        params.dataFinal,
        params.praca || 'all',
        params.includeNames ? 'names' : 'summary',
    ].join('|');
}

function getCachedFluxo(cacheKey: string) {
    const cached = fluxoCache.get(cacheKey);

    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
        fluxoCache.delete(cacheKey);
        return null;
    }

    return cached.data;
}

function setCachedFluxo(cacheKey: string, data: unknown[]) {
    fluxoCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + FLUXO_CACHE_TTL_MS,
    });

    if (fluxoCache.size > FLUXO_CACHE_MAX_ENTRIES) {
        const oldestKey = fluxoCache.keys().next().value;
        if (oldestKey) fluxoCache.delete(oldestKey);
    }
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

        const body = await request.json().catch(() => null) as FluxoRequestBody | null;
        const dataInicial = normalizeDate(body?.dataInicial);
        const dataFinal = normalizeDate(body?.dataFinal);
        const requestedOrganizationId =
            typeof body?.organizationId === 'string' && UUID_RE.test(body.organizationId)
                ? body.organizationId
                : null;
        const profileOrganizationId = auth.profile.organization_id || null;
        const organizationId = requestedOrganizationId || profileOrganizationId;
        const praca = normalizePraca(body?.praca);
        const includeNames = body?.includeNames === true;

        if (!dataInicial || !dataFinal) {
            return NextResponse.json({ data: null, error: 'Periodo invalido para consulta.' }, { status: 400 });
        }

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ data: null, error: 'Organizacao invalida para consulta.' }, { status: 400 });
        }

        if (!hasElevatedRole(auth.profile)) {
            if (!profileOrganizationId || organizationId !== profileOrganizationId) {
                return NextResponse.json({ data: null, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
            }
        }

        const cacheKey = buildFluxoCacheKey({
            dataInicial,
            dataFinal,
            includeNames,
            organizationId,
            praca,
        });

        const cached = getCachedFluxo(cacheKey);
        if (cached) {
            return NextResponse.json({ data: cached, error: null, cached: true });
        }

        let requestPromise = fluxoInFlight.get(cacheKey);

        if (!requestPromise) {
            requestPromise = (async () => {
                const admin = createServiceRoleClient();
                const { data, error } = await admin.rpc('get_fluxo_semanal', {
                    p_data_inicial: dataInicial,
                    p_data_final: dataFinal,
                    p_include_names: includeNames,
                    p_organization_id: organizationId,
                    p_praca: praca,
                });

                if (error) {
                    throw Object.assign(new Error(error.message), { details: error });
                }

                return Array.isArray(data) ? data : [];
            })();

            fluxoInFlight.set(cacheKey, requestPromise);
        }

        try {
            const data = await requestPromise;
            setCachedFluxo(cacheKey, data);
            return NextResponse.json({ data, error: null, cached: false });
        } catch (rpcError) {
            const message = rpcError instanceof Error ? rpcError.message : 'Erro ao consultar fluxo semanal.';
            const details = typeof rpcError === 'object' && rpcError !== null && 'details' in rpcError
                ? (rpcError as { details: unknown }).details
                : rpcError;

            return NextResponse.json({ data: null, error: message, details }, { status: 500 });
        } finally {
            if (fluxoInFlight.get(cacheKey) === requestPromise) {
                fluxoInFlight.delete(cacheKey);
            }
        }
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao consultar fluxo semanal.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
