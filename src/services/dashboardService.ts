import { createHash } from 'node:crypto';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import { createRequestKey } from '@/utils/request/createRequestKey';
import type { ValoresEntregador } from '@/types';
import { normalizeValoresEntregadores } from '@/utils/valores/normalizeValoresEntregadores';
import { filterAndSortValores } from '@/utils/valores/filterAndSortValores';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UTR_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_turno', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const ENTREGADORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados', 'p_search'] as const;
const ENTREGADORES_PAGE_ALLOWED_PARAMS = [...ENTREGADORES_ALLOWED_PARAMS, 'p_limit', 'p_page', 'p_sort_field', 'p_sort_direction', 'p_only_inactive'] as const;
const VALORES_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
const VALORES_DETALHADOS_ALLOWED_PARAMS = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_limit', 'p_offset'] as const;
const VALORES_SORT_FIELDS = new Set<keyof ValoresEntregador>([
  'nome_entregador',
  'id_entregador',
  'total_taxas',
  'numero_corridas_aceitas',
  'taxa_media',
  'turno',
  'sub_praca',
]);

export type DashboardDataMode = 'utr' | 'entregadores' | 'entregadores_page' | 'valores' | 'valores_page' | 'valores_detalhados' | 'resumo_local';

const CACHE_TTL_BY_MODE_MS: Record<DashboardDataMode, number> = {
  utr: 5 * 60_000,
  entregadores: 5 * 60_000,
  entregadores_page: 60_000,
  valores: 5 * 60_000,
  valores_page: 60_000,
  valores_detalhados: 30_000,
  resumo_local: 5 * 60_000,
};
const MAX_CACHE_ENTRIES = 120;
const PREPARED_VALORES_CACHE_TTL_MS = 60_000;
const MAX_PREPARED_VALORES_CACHE_ENTRIES = 12;

type DashboardDataCacheEntry = {
  data: unknown;
  expiresAt: number;
};

const dashboardDataCache = new Map<string, DashboardDataCacheEntry>();
const inFlightDashboardData = new Map<string, Promise<unknown>>();

type PreparedValoresData = {
  rows: ValoresEntregador[];
  totalCorridas: number;
  totalGeral: number;
  snapshot: string;
};

type PreparedValoresCacheEntry = {
  data: PreparedValoresData;
  expiresAt: number;
};

const preparedValoresCache = new Map<string, PreparedValoresCacheEntry>();
const inFlightPreparedValores = new Map<string, Promise<PreparedValoresData>>();

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

export function normalizeMode(value: unknown): DashboardDataMode | null {
  if (
      value === 'utr'
      || value === 'entregadores'
      || value === 'entregadores_page'
      || value === 'valores'
      || value === 'valores_page'
      || value === 'valores_detalhados'
      || value === 'resumo_local'
  ) {
      return value;
  }
  return null;
}

export function asObject(value: unknown) {
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

async function resolvePreparedValores(
  payload: Record<string, unknown>,
  fetcher: () => Promise<PreparedValoresData>,
) {
  const cacheKey = createRequestKey({ mode: 'valores_prepared', payload });
  const now = Date.now();
  const cached = preparedValoresCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
      preparedValoresCache.delete(cacheKey);
      preparedValoresCache.set(cacheKey, cached);
      return cached.data;
  }

  if (cached) preparedValoresCache.delete(cacheKey);

  const existingRequest = inFlightPreparedValores.get(cacheKey);
  if (existingRequest) return existingRequest;

  const request = fetcher();
  inFlightPreparedValores.set(cacheKey, request);

  try {
      const data = await request;
      while (preparedValoresCache.size >= MAX_PREPARED_VALORES_CACHE_ENTRIES) {
          const oldestKey = preparedValoresCache.keys().next().value as string | undefined;
          if (!oldestKey) break;
          preparedValoresCache.delete(oldestKey);
      }
      preparedValoresCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + PREPARED_VALORES_CACHE_TTL_MS,
      });
      return data;
  } finally {
      if (inFlightPreparedValores.get(cacheKey) === request) {
          inFlightPreparedValores.delete(cacheKey);
      }
  }
}

function isUnfilteredValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'todas' || normalized === 'todos' || normalized === 'all';
}

function canUseAggregatedValoresSource(payload: Record<string, unknown>) {
  // The source already returns one row per driver for unfiltered year/week
  // requests. The public wrapper only parses that JSON and aggregates it again.
  // Keep filtered/legacy cases on the public RPC to preserve name consolidation.
  const year = payload.p_ano;
  const week = payload.p_semana;

  return typeof year === 'number'
      && Number.isInteger(year)
      && year >= 2000
      && year <= 2100
      && (week === null || week === undefined || (typeof week === 'number' && Number.isInteger(week) && week >= 1 && week <= 53))
      && payload.p_data_inicial == null
      && payload.p_data_final == null
      && UUID_RE.test(String(payload.p_organization_id || ''))
      && isUnfilteredValue(payload.p_praca)
      && isUnfilteredValue(payload.p_sub_praca)
      && isUnfilteredValue(payload.p_origem);
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

export function resolveOrganizationId(payload: Record<string, unknown>, profileOrganizationId: string | null) {
  const requestedOrganizationId =
      typeof payload.p_organization_id === 'string' && UUID_RE.test(payload.p_organization_id)
          ? payload.p_organization_id
          : null;
  return requestedOrganizationId || profileOrganizationId;
}

export async function fetchDashboardData(mode: DashboardDataMode, source: Record<string, unknown>, organizationId: string) {
  if (mode === 'valores_page') {
      const valoresPayload = pickPayload(source, VALORES_ALLOWED_PARAMS);
      valoresPayload.p_organization_id = organizationId;

      const requestedLimit = Number(source.p_limit);
      const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
          ? Math.min(Math.trunc(requestedLimit), 100)
          : 100;
      const offset = normalizePositiveInteger(source.p_offset, 0, 1000000);
      const search = typeof source.p_search === 'string' ? source.p_search.trim() : '';
      const requestedSortField = typeof source.p_sort_field === 'string'
          ? source.p_sort_field as keyof ValoresEntregador
          : 'total_taxas';
      const sortField = VALORES_SORT_FIELDS.has(requestedSortField) ? requestedSortField : 'total_taxas';
      const sortDirection = source.p_sort_direction === 'asc' ? 'asc' : 'desc';
      const expectedSnapshot = typeof source.p_snapshot === 'string' ? source.p_snapshot : null;
      const pageCachePayload = {
          ...valoresPayload,
          p_limit: limit,
          p_offset: offset,
          p_search: search,
          p_sort_field: sortField,
          p_sort_direction: sortDirection,
          p_snapshot: expectedSnapshot,
      };
      const preparedPayload = {
          ...valoresPayload,
          p_search: search,
          p_sort_field: sortField,
          p_sort_direction: sortDirection,
      };

      return resolveWithCache('valores_page', pageCachePayload, async () => {
          const prepared = await resolvePreparedValores(preparedPayload, async () => {
              const fullResult = await fetchDashboardData('valores', valoresPayload, organizationId) as { data?: unknown };
              let rawData = fullResult?.data;

              if (Array.isArray(rawData) && rawData.length > 0) rawData = rawData[0];
              if (rawData && typeof rawData === 'object' && 'listar_valores_entregadores' in rawData) {
                  rawData = (rawData as { listar_valores_entregadores?: unknown }).listar_valores_entregadores;
              }

              const rawRows = Array.isArray(rawData)
                  ? rawData
                  : rawData && typeof rawData === 'object' && Array.isArray((rawData as { entregadores?: unknown }).entregadores)
                      ? (rawData as { entregadores: unknown[] }).entregadores
                      : rawData && typeof rawData === 'object' && Array.isArray((rawData as { valores?: unknown }).valores)
                          ? (rawData as { valores: unknown[] }).valores
                          : null;

              if (!rawRows) {
                  throw new Error('A consulta de valores respondeu em um formato inválido.');
              }

              const normalizedRows = normalizeValoresEntregadores(rawRows as ValoresEntregador[]);
              const rows = filterAndSortValores(normalizedRows, {
                  searchTerm: search,
                  sortField,
                  sortDirection,
              });
              const snapshotHasher = createHash('sha256');
              let totalCorridas = 0;
              let totalGeral = 0;

              for (const row of rows) {
                  snapshotHasher.update(row.id_entregador);
                  snapshotHasher.update('\u0000');
                  snapshotHasher.update(String(row.nome_entregador || ''));
                  snapshotHasher.update('\u0000');
                  snapshotHasher.update(String(row.total_taxas));
                  snapshotHasher.update('\u0000');
                  snapshotHasher.update(String(row.numero_corridas_aceitas));
                  snapshotHasher.update('\n');
                  totalCorridas += Number(row.numero_corridas_aceitas) || 0;
                  totalGeral += Number(row.total_taxas) || 0;
              }

              return {
                  rows,
                  totalCorridas,
                  totalGeral,
                  snapshot: snapshotHasher.digest('hex'),
              };
          });

          if (expectedSnapshot && expectedSnapshot !== prepared.snapshot) {
              throw new Error('Os valores mudaram enquanto a lista era carregada. Atualize a consulta para evitar linhas repetidas ou ausentes.');
          }

          const entregadores = prepared.rows.slice(offset, offset + limit);

          if (offset < prepared.rows.length && entregadores.length === 0) {
              throw new Error('A página solicitada de valores não retornou linhas. Tente atualizar a lista.');
          }

          return {
              entregadores,
              total: prepared.rows.length,
              total_geral: prepared.totalGeral,
              total_corridas: prepared.totalCorridas,
              taxa_media_geral: prepared.totalCorridas > 0 ? prepared.totalGeral / prepared.totalCorridas : 0,
              limit,
              offset,
              has_more: offset + entregadores.length < prepared.rows.length,
              snapshot: prepared.snapshot,
          };
      });
  }

  const admin = createServiceRoleClient();

  if (mode === 'resumo_local') {
      const year = Number(source.p_ano);
      if (!Number.isFinite(year) || year < 2020 || year > 2100) {
          throw new Error('Ano inválido para resumo semanal.');
      }

      const params = {
          p_ano: Math.trunc(year),
          p_organization_id: organizationId,
          p_pracas: normalizePracas(source.p_pracas),
      };

      return resolveWithCache('resumo_local', params, async () => {
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
  }

  const allowedParams = mode === 'utr'
      ? UTR_ALLOWED_PARAMS
      : mode === 'entregadores_page'
          ? ENTREGADORES_PAGE_ALLOWED_PARAMS
      : mode === 'entregadores'
          ? ENTREGADORES_ALLOWED_PARAMS
      : mode === 'valores_detalhados'
          ? VALORES_DETALHADOS_ALLOWED_PARAMS
          : VALORES_ALLOWED_PARAMS;
          
  const payload = pickPayload(source, allowedParams);
  payload.p_organization_id = organizationId;

  if (mode === 'valores_detalhados') {
      payload.p_limit = normalizePositiveInteger(payload.p_limit, 25, 200);
      payload.p_offset = normalizePositiveInteger(payload.p_offset, 0, 100000);
  }

  if (mode === 'entregadores_page') {
      const requestedLimit = Number(payload.p_limit);
      payload.p_limit = Number.isInteger(requestedLimit) && requestedLimit >= -1 && requestedLimit <= 200
          ? requestedLimit
          : -1;
      const requestedPage = normalizePositiveInteger(payload.p_page, 1, 1000000);
      payload.p_page = Math.max(1, requestedPage);
      payload.p_sort_field = typeof payload.p_sort_field === 'string' ? payload.p_sort_field : 'aderencia_percentual';
      payload.p_sort_direction = payload.p_sort_direction === 'asc' ? 'asc' : 'desc';
      payload.p_only_inactive = payload.p_only_inactive === true;
  }

  const rpcName = mode === 'utr'
      ? 'calcular_utr_completo'
      : mode === 'entregadores_page'
          ? 'listar_entregadores_dashboard_page_v2'
      : mode === 'entregadores'
          ? 'listar_entregadores_dashboard_fast_v1'
      : mode === 'valores_detalhados'
          ? 'listar_valores_entregadores_detalhado'
          : canUseAggregatedValoresSource(payload)
              ? '_listar_valores_entregadores_source_20260719'
              : 'listar_valores_entregadores';

  return resolveWithCache(mode, payload, async () => {
      const { data: rpcData, error } = await admin.rpc(rpcName, payload);
      if (error) {
          throw new Error(error.message);
      }
      return rpcData ?? null;
  });
}
