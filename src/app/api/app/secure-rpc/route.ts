import { NextResponse } from 'next/server';
import {
  CurrentUserProfile,
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
const SECURE_RPC_CACHE_TTL_MS = 60_000;
const SECURE_RPC_DETAIL_CACHE_TTL_MS = 20_000;
const MAX_SECURE_RPC_CACHE_ENTRIES = 160;

const ALLOWED_RPC = new Set([
  'dashboard_evolucao_bundle',
  'dashboard_resumo',
  'get_available_weeks',
  'get_city_last_updates',
  'get_current_user_profile',
  'get_dashboard_dimension_options',
  'get_entregador_detail',
  'get_entregadores_details',
  'get_gamification_leaderboard',
  'get_marketing_atendentes_data',
  'get_marketing_comparison_weekly',
  'get_marketing_resultados_data',
  'get_origens_by_praca',
  'get_subpracas_by_praca',
  'get_turnos_by_praca',
  'get_valores_cidade_resumo',
  'is_global_admin',
  'list_pracas_disponiveis',
  'listar_anos_disponiveis',
  'listar_todas_semanas',
]);

const ORG_PARAM_BY_RPC: Record<string, string> = {
  dashboard_evolucao_bundle: 'p_organization_id',
  dashboard_resumo: 'p_organization_id',
  get_available_weeks: 'p_organization_id',
  get_city_last_updates: 'p_organization_id',
  get_dashboard_dimension_options: 'p_organization_id',
  get_entregador_detail: 'p_org_id',
  get_entregadores_details: 'p_organization_id',
  get_marketing_atendentes_data: 'p_organization_id',
  get_marketing_comparison_weekly: 'p_organization_id',
  get_marketing_resultados_data: 'p_organization_id',
  get_valores_cidade_resumo: 'p_organization_id',
};

const FULL_CITY_ACCESS_ONLY = new Set([
  'get_entregador_detail',
  'get_entregadores_details',
  'get_marketing_atendentes_data',
  'get_marketing_comparison_weekly',
  'get_marketing_resultados_data',
  'get_valores_cidade_resumo',
]);

type SecureRpcBody = {
  functionName?: unknown;
  params?: unknown;
};

type SecureRpcCacheEntry = {
  data: unknown;
  expiresAt: number;
};

const secureRpcCache = new Map<string, SecureRpcCacheEntry>();
const inFlightSecureRpc = new Map<string, Promise<unknown>>();

function getSecureRpcCacheTtl(functionName: string) {
  return functionName === 'get_entregador_detail' || functionName === 'get_entregadores_details'
    ? SECURE_RPC_DETAIL_CACHE_TTL_MS
    : SECURE_RPC_CACHE_TTL_MS;
}

function getSecureRpcCacheKey(functionName: string, params: Record<string, unknown>, profile: CurrentUserProfile) {
  return createRequestKey({
    functionName,
    params,
    scope: {
      id: profile.id,
      role: profile.role,
      organization_id: profile.organization_id,
      assigned_pracas: normalizeAssignedPracas(profile),
    },
  });
}

function cleanupSecureRpcCache(now: number) {
  if (secureRpcCache.size <= MAX_SECURE_RPC_CACHE_ENTRIES) return;

  let removed = 0;
  for (const [key, value] of secureRpcCache.entries()) {
    if (removed >= 30) break;
    if (value.expiresAt <= now) {
      secureRpcCache.delete(key);
      removed++;
    }
  }

  while (secureRpcCache.size > MAX_SECURE_RPC_CACHE_ENTRIES) {
    const oldestKey = secureRpcCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    secureRpcCache.delete(oldestKey);
  }
}

async function resolveSecureRpcWithCache(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile,
  fetcher: () => Promise<unknown>,
) {
  const cacheKey = getSecureRpcCacheKey(functionName, params, profile);
  const now = Date.now();
  const cached = secureRpcCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return { data: cached.data, cached: true };
  }

  if (cached) {
    secureRpcCache.delete(cacheKey);
  }

  cleanupSecureRpcCache(now);

  const existingRequest = inFlightSecureRpc.get(cacheKey);
  if (existingRequest) {
    return { data: await existingRequest, cached: true };
  }

  const request = fetcher();
  inFlightSecureRpc.set(cacheKey, request);

  try {
    const data = await request;
    secureRpcCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + getSecureRpcCacheTtl(functionName),
    });
    return { data, cached: false };
  } finally {
    inFlightSecureRpc.delete(cacheKey);
  }
}

function asParams(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function normalizeRole(profile: CurrentUserProfile) {
  return String(profile.role || '').toLowerCase();
}

function hasFullCityAccess(profile: CurrentUserProfile) {
  const role = normalizeRole(profile);
  return hasElevatedRole(profile) || role === 'marketing';
}

function normalizeAssignedPracas(profile: CurrentUserProfile) {
  return Array.isArray(profile.assigned_pracas)
    ? profile.assigned_pracas.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function isAllPraca(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'todas' || normalized === 'todos' || normalized === 'all';
}

function ensureAuthorizedOrganization(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  const orgKey = ORG_PARAM_BY_RPC[functionName];
  if (!orgKey) return { params };

  const nextParams = { ...params };
  const profileOrgId = typeof profile.organization_id === 'string' && UUID_RE.test(profile.organization_id)
    ? profile.organization_id
    : null;
  const requestedOrgId = typeof nextParams[orgKey] === 'string' && UUID_RE.test(nextParams[orgKey] as string)
    ? nextParams[orgKey] as string
    : null;

  if (!hasElevatedRole(profile)) {
    if (!profileOrgId) {
      return { error: 'Organização inválida para este usuário.' };
    }

    nextParams[orgKey] = profileOrgId;
    return { params: nextParams };
  }

  if (
    typeof nextParams[orgKey] === 'string' &&
    String(nextParams[orgKey]).trim() &&
    !requestedOrgId
  ) {
    return { error: 'Organização inválida para consulta.' };
  }

  return { params: nextParams };
}

function ensurePracaScope(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  if (hasFullCityAccess(profile)) return { params };

  const assigned = normalizeAssignedPracas(profile);
  if (assigned.length === 0) return { params };

  const allowed = new Set(assigned.map((item) => item.toUpperCase()));
  const nextParams = { ...params };
  const praca = typeof nextParams.p_praca === 'string' ? nextParams.p_praca.trim() : '';

  if (praca && !isAllPraca(praca) && !allowed.has(praca.toUpperCase())) {
    return { error: 'Praça não permitida para este usuário.' };
  }

  if (Array.isArray(nextParams.p_pracas)) {
    const scoped = nextParams.p_pracas
      .map((item) => String(item).trim())
      .filter((item) => item && allowed.has(item.toUpperCase()));

    if (scoped.length === 0) {
      return { error: 'Nenhuma praça permitida foi informada.' };
    }

    nextParams.p_pracas = scoped;
    return { params: nextParams };
  }

  if (!praca || isAllPraca(praca)) {
    if (functionName === 'get_marketing_comparison_weekly' && assigned.length !== 1) {
      return { error: 'Informe uma praça permitida para esta consulta.' };
    }

    if (assigned.length === 1) {
      nextParams.p_praca = assigned[0];
    } else {
      nextParams.p_pracas = assigned;
    }
  }

  return { params: nextParams };
}

function clampPagination(params: Record<string, unknown>) {
  const nextParams = { ...params };

  if ('p_limit' in nextParams) {
    const limit = Number(nextParams.p_limit);
    nextParams.p_limit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 200) : 50;
  }

  if ('p_offset' in nextParams) {
    const offset = Number(nextParams.p_offset);
    nextParams.p_offset = Number.isFinite(offset) ? Math.min(Math.max(Math.trunc(offset), 0), 100000) : 0;
  }

  return nextParams;
}

function filterPracasResult(data: unknown, profile: CurrentUserProfile) {
  if (hasFullCityAccess(profile)) return data;

  const assigned = normalizeAssignedPracas(profile);
  if (assigned.length === 0 || !Array.isArray(data)) return [];

  const allowed = new Set(assigned.map((item) => item.toUpperCase()));

  return data.filter((item) => {
    const praca = typeof item === 'string'
      ? item
      : item && typeof item === 'object'
        ? String((item as Record<string, unknown>).praca || '')
        : '';

    return allowed.has(praca.toUpperCase());
  });
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

    const body = await request.json().catch(() => null) as SecureRpcBody | null;
    const functionName = typeof body?.functionName === 'string' ? body.functionName : '';

    if (!ALLOWED_RPC.has(functionName)) {
      return NextResponse.json({ data: null, error: 'RPC protegida não permitida.' }, { status: 400 });
    }

    if (functionName === 'get_current_user_profile') {
      return NextResponse.json({ data: auth.profile, error: null });
    }

    if (functionName === 'is_global_admin') {
      return NextResponse.json({ data: hasElevatedRole(auth.profile), error: null });
    }

    if (FULL_CITY_ACCESS_ONLY.has(functionName) && !hasFullCityAccess(auth.profile)) {
      return NextResponse.json({ data: null, error: 'Usuário sem permissão para esta consulta.' }, { status: 403 });
    }

    let params = clampPagination(asParams(body?.params));
    const orgScope = ensureAuthorizedOrganization(functionName, params, auth.profile);
    if (orgScope.error) {
      return NextResponse.json({ data: null, error: orgScope.error }, { status: 403 });
    }

    params = orgScope.params || params;
    const pracaScope = ensurePracaScope(functionName, params, auth.profile);
    if (pracaScope.error) {
      return NextResponse.json({ data: null, error: pracaScope.error }, { status: 403 });
    }

    params = pracaScope.params || params;

    const admin = createServiceRoleClient();
    const { data, cached } = await resolveSecureRpcWithCache(functionName, params, auth.profile, async () => {
      const { data: rpcData, error } = await admin.rpc(functionName, params);

      if (error) {
        throw new Error(error.message);
      }

      return functionName === 'list_pracas_disponiveis'
        ? filterPracasResult(rpcData, auth.profile)
        : rpcData ?? null;
    });

    return NextResponse.json({
      data,
      error: null,
      cached,
    });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao executar RPC protegida.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
