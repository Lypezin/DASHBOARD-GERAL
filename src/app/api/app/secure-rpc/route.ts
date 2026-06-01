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

const RPCS_WITHOUT_CITY_SCOPE = new Set([
  'get_available_weeks',
  'get_city_last_updates',
  'listar_anos_disponiveis',
  'listar_todas_semanas',
  'list_pracas_disponiveis',
]);

const RPCS_SUPPORTING_PRACAS_ARRAY = new Set([
  'get_dashboard_dimension_options',
  'get_origens_by_praca',
  'get_subpracas_by_praca',
  'get_turnos_by_praca',
]);

const INTERNAL_SCOPED_PRACAS_PARAM = '__secure_scoped_pracas';

const DASHBOARD_ARRAY_FIELDS = [
  { outputKey: 'aderencia_semanal', aliases: ['aderencia_semanal', 'semanal'], keys: ['semana'] },
  { outputKey: 'aderencia_dia', aliases: ['aderencia_dia', 'dia'], keys: ['data', 'dia', 'dia_iso'] },
  { outputKey: 'aderencia_turno', aliases: ['aderencia_turno', 'turno'], keys: ['turno'] },
  { outputKey: 'aderencia_sub_praca', aliases: ['aderencia_sub_praca', 'sub_praca'], keys: ['sub_praca'] },
  { outputKey: 'aderencia_origem', aliases: ['aderencia_origem', 'origem'], keys: ['origem'] },
  { outputKey: 'aderencia_dia_origem', aliases: ['aderencia_dia_origem', 'dia_origem'], keys: ['data', 'dia', 'dia_iso', 'origem'] },
];

const DASHBOARD_ALIAS_BY_OUTPUT: Record<string, string> = {
  aderencia_semanal: 'semanal',
  aderencia_dia: 'dia',
  aderencia_turno: 'turno',
  aderencia_sub_praca: 'sub_praca',
  aderencia_origem: 'origem',
  aderencia_dia_origem: 'dia_origem',
};

const DASHBOARD_ROW_SUM_FIELDS = [
  'segundos_planejados',
  'segundos_realizados',
  'corridas_ofertadas',
  'corridas_aceitas',
  'corridas_rejeitadas',
  'corridas_completadas',
  'total_drivers',
  'total_slots',
];

const DASHBOARD_TOTAL_SUM_FIELDS = [
  'total_ofertadas',
  'total_aceitas',
  'total_completadas',
  'total_rejeitadas',
  'total_valor_bruto_centavos',
];

const DASHBOARD_NESTED_TOTAL_SUM_FIELDS = [
  'corridas_ofertadas',
  'corridas_aceitas',
  'corridas_rejeitadas',
  'corridas_completadas',
];

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

function normalizePracaKey(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function isAllPraca(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'todas' || normalized === 'todos' || normalized === 'all';
}

function splitPracas(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitPracas(item));
  }

  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && !isAllPraca(item));
}

function uniquePracas(pracas: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const praca of pracas) {
    const key = normalizePracaKey(praca);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(praca);
  }

  return unique;
}

function asDashboardRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === 'object' ? first as Record<string, unknown> : {};
  }

  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function recomputeDashboardMetricRow(row: Record<string, unknown>) {
  const segundosPlanejados = toFiniteNumber(row.segundos_planejados);
  const segundosRealizados = toFiniteNumber(row.segundos_realizados);
  const ofertadas = toFiniteNumber(row.corridas_ofertadas);
  const aceitas = toFiniteNumber(row.corridas_aceitas);
  const completadas = toFiniteNumber(row.corridas_completadas);

  row.aderencia_percentual = percentage(segundosRealizados, segundosPlanejados);
  row.taxa_aceitacao = percentage(aceitas, ofertadas);
  row.taxa_completude = percentage(completadas, aceitas);

  if ('segundos_planejados' in row) row.horas_a_entregar = formatSeconds(segundosPlanejados);
  if ('segundos_realizados' in row) row.horas_entregues = formatSeconds(segundosRealizados);

  return row;
}

function getDashboardRowKey(row: Record<string, unknown>, keyFields: string[]) {
  return keyFields
    .map((field) => String(row[field] ?? ''))
    .join('|');
}

function mergeDashboardRows(rows: Record<string, unknown>[], keyFields: string[]) {
  const grouped = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const key = getDashboardRowKey(row, keyFields);
    const current = grouped.get(key);

    if (!current) {
      const nextRow = { ...row };
      for (const field of DASHBOARD_ROW_SUM_FIELDS) {
        if (field in nextRow) nextRow[field] = toFiniteNumber(nextRow[field]);
      }
      grouped.set(key, nextRow);
      continue;
    }

    for (const field of DASHBOARD_ROW_SUM_FIELDS) {
      if (field in row || field in current) {
        current[field] = toFiniteNumber(current[field]) + toFiniteNumber(row[field]);
      }
    }
  }

  return Array.from(grouped.values()).map(recomputeDashboardMetricRow);
}

function mergeDashboardDimensions(records: Record<string, unknown>[]) {
  const dimensionKeys = ['anos', 'semanas', 'pracas', 'sub_pracas', 'origens', 'turnos'];
  const dimensions: Record<string, unknown[]> = {};

  for (const key of dimensionKeys) {
    const seen = new Set<string>();
    const values: unknown[] = [];

    for (const record of records) {
      const recordDimensions = record.dimensoes && typeof record.dimensoes === 'object'
        ? record.dimensoes as Record<string, unknown>
        : {};
      const items = Array.isArray(recordDimensions[key]) ? recordDimensions[key] as unknown[] : [];

      for (const item of items) {
        const itemKey = String(item);
        if (seen.has(itemKey)) continue;
        seen.add(itemKey);
        values.push(item);
      }
    }

    dimensions[key] = values;
  }

  return dimensions;
}

function mergeDashboardResumoResults(results: unknown[]) {
  const records = results.map(asDashboardRecord).filter((record) => Object.keys(record).length > 0);
  const merged: Record<string, unknown> = {
    total_ofertadas: 0,
    total_aceitas: 0,
    total_completadas: 0,
    total_rejeitadas: 0,
    aderencia_semanal: [],
    aderencia_dia: [],
    aderencia_turno: [],
    aderencia_sub_praca: [],
    aderencia_origem: [],
    aderencia_dia_origem: [],
    dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] },
  };

  if (records.length === 0) return merged;

  for (const record of records) {
    for (const field of DASHBOARD_TOTAL_SUM_FIELDS) {
      if (field in record || field in merged) {
        merged[field] = toFiniteNumber(merged[field]) + toFiniteNumber(record[field]);
      }
    }

    const totals = record.totais && typeof record.totais === 'object'
      ? record.totais as Record<string, unknown>
      : {};
    const mergedTotals = merged.totais && typeof merged.totais === 'object'
      ? merged.totais as Record<string, unknown>
      : {};

    for (const field of DASHBOARD_NESTED_TOTAL_SUM_FIELDS) {
      mergedTotals[field] = toFiniteNumber(mergedTotals[field]) + toFiniteNumber(totals[field]);
    }

    merged.totais = mergedTotals;
  }

  merged.dimensoes = mergeDashboardDimensions(records);

  for (const field of DASHBOARD_ARRAY_FIELDS) {
    const rows = records.flatMap((record) =>
      field.aliases.flatMap((alias) => {
        const value = record[alias];
        return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : [];
      })
    );

    const mergedRows = mergeDashboardRows(rows, field.keys);
    merged[field.outputKey] = mergedRows;
    merged[DASHBOARD_ALIAS_BY_OUTPUT[field.outputKey]] = mergedRows;
  }

  return merged;
}

function getInternalScopedPracas(params: Record<string, unknown>) {
  const value = params[INTERNAL_SCOPED_PRACAS_PARAM];
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function stripInternalParams(params: Record<string, unknown>) {
  const nextParams = { ...params };
  delete nextParams[INTERNAL_SCOPED_PRACAS_PARAM];
  return nextParams;
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

function ensurePracaScopeLegacy(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  if (hasFullCityAccess(profile)) return { params };

  const assigned = normalizeAssignedPracas(profile);
  if (assigned.length === 0) return { params };

  const allowed = new Set(assigned.map(normalizePracaKey));
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

function ensurePracaScope(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  if (hasFullCityAccess(profile)) return { params };
  if (RPCS_WITHOUT_CITY_SCOPE.has(functionName)) {
    const nextParams = { ...params };
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  const assigned = uniquePracas(normalizeAssignedPracas(profile));
  if (assigned.length === 0) return { params };

  const allowedByKey = new Map(assigned.map((item) => [normalizePracaKey(item), item]));
  const supportsPracasArray = RPCS_SUPPORTING_PRACAS_ARRAY.has(functionName);
  const nextParams = { ...params };
  const requestedPracas = uniquePracas([
    ...splitPracas(nextParams.p_praca),
    ...splitPracas(nextParams.p_pracas),
  ]);

  if (requestedPracas.length > 0) {
    const scoped = requestedPracas
      .map((item) => allowedByKey.get(normalizePracaKey(item)))
      .filter((item): item is string => Boolean(item));

    if (scoped.length !== requestedPracas.length) {
      return { error: 'Praca nao permitida para este usuario.' };
    }

    if (supportsPracasArray) {
      nextParams.p_pracas = scoped;
      delete nextParams.p_praca;
      return { params: nextParams };
    }

    if (functionName === 'dashboard_resumo' && scoped.length > 1) {
      nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = scoped;
      delete nextParams.p_praca;
      delete nextParams.p_pracas;
      return { params: nextParams };
    }

    if (scoped.length === 1) {
      nextParams.p_praca = scoped[0];
      delete nextParams.p_pracas;
      return { params: nextParams };
    }

    return { error: 'Selecione uma unica praca permitida para esta consulta.' };
  }

  if (supportsPracasArray) {
    nextParams.p_pracas = assigned;
    delete nextParams.p_praca;
    return { params: nextParams };
  }

  if (functionName === 'dashboard_resumo' && assigned.length > 1) {
    nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = assigned;
    delete nextParams.p_praca;
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  if (assigned.length === 1) {
    nextParams.p_praca = assigned[0];
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  return { error: 'Selecione uma praca permitida para esta consulta.' };
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

  const allowed = new Set(assigned.map(normalizePracaKey));

  return data.filter((item) => {
    const praca = typeof item === 'string'
      ? item
      : item && typeof item === 'object'
        ? String((item as Record<string, unknown>).praca || '')
        : '';

    return allowed.has(normalizePracaKey(praca));
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
      const scopedPracas = functionName === 'dashboard_resumo' ? getInternalScopedPracas(params) : [];

      if (functionName === 'dashboard_resumo' && scopedPracas.length > 1) {
        const baseParams = stripInternalParams(params);
        const results = await Promise.all(scopedPracas.map(async (praca) => {
          const { data: rpcData, error } = await admin.rpc(functionName, {
            ...baseParams,
            p_praca: praca,
          });

          if (error) {
            throw new Error(`Erro em ${praca}: ${error.message}`);
          }

          return rpcData ?? null;
        }));

        return mergeDashboardResumoResults(results);
      }

      const rpcParams = stripInternalParams(params);
      const { data: rpcData, error } = await admin.rpc(functionName, rpcParams);

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
