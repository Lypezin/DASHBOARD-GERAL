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

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      return { error: 'Organizacao invalida para este usuario.' };
    }

    nextParams[orgKey] = profileOrgId;
    return { params: nextParams };
  }

  if (
    typeof nextParams[orgKey] === 'string' &&
    String(nextParams[orgKey]).trim() &&
    !requestedOrgId
  ) {
    return { error: 'Organizacao invalida para consulta.' };
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
    return { error: 'Praca nao permitida para este usuario.' };
  }

  if (Array.isArray(nextParams.p_pracas)) {
    const scoped = nextParams.p_pracas
      .map((item) => String(item).trim())
      .filter((item) => item && allowed.has(item.toUpperCase()));

    if (scoped.length === 0) {
      return { error: 'Nenhuma praca permitida foi informada.' };
    }

    nextParams.p_pracas = scoped;
    return { params: nextParams };
  }

  if (!praca || isAllPraca(praca)) {
    if (functionName === 'get_marketing_comparison_weekly' && assigned.length !== 1) {
      return { error: 'Informe uma praca permitida para esta consulta.' };
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
      notApprovedMessage: 'Usuario ainda nao aprovado.',
    });

    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as SecureRpcBody | null;
    const functionName = typeof body?.functionName === 'string' ? body.functionName : '';

    if (!ALLOWED_RPC.has(functionName)) {
      return NextResponse.json({ data: null, error: 'RPC protegida nao permitida.' }, { status: 400 });
    }

    if (functionName === 'get_current_user_profile') {
      return NextResponse.json({ data: auth.profile, error: null });
    }

    if (functionName === 'is_global_admin') {
      return NextResponse.json({ data: hasElevatedRole(auth.profile), error: null });
    }

    if (FULL_CITY_ACCESS_ONLY.has(functionName) && !hasFullCityAccess(auth.profile)) {
      return NextResponse.json({ data: null, error: 'Usuario sem permissao para esta consulta.' }, { status: 403 });
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
    const { data, error } = await admin.rpc(functionName, params);

    if (error) {
      return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({
      data: functionName === 'list_pracas_disponiveis' ? filterPracasResult(data, auth.profile) : data ?? null,
      error: null,
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
