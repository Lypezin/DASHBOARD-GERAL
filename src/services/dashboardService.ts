import { createHash } from 'node:crypto';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import { createRequestKey } from '@/utils/request/createRequestKey';
import type { Entregador, EntregadoresSortField, ValoresEntregador } from '@/types';
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
const ENTREGADORES_PAGE_SORT_FIELDS = new Set<EntregadoresSortField>([
  'id_entregador',
  'nome_entregador',
  'corridas_ofertadas',
  'corridas_aceitas',
  'corridas_rejeitadas',
  'corridas_completadas',
  'aderencia_percentual',
  'rejeicao_percentual',
  'total_segundos',
  'percentual_aceitas',
  'percentual_completadas',
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
const MAX_BROAD_IN_MEMORY_ENTREGADORES_RANGE_DAYS = 3660;
const MAX_CACHE_ENTRIES_BY_MODE: Partial<Record<DashboardDataMode, number>> = {
  // Unpaged Entregadores responses can be several megabytes per organization/filter.
  entregadores: 4,
  // Values pages keep a second normalized copy for pagination/search/sort.
  // Bound the raw response cache too, so filter churn cannot retain many full lists.
  valores: 4,
};
const PREPARED_VALORES_CACHE_TTL_MS = 60_000;
const SOURCE_VALORES_CACHE_TTL_MS = 60_000;
const MAX_SOURCE_VALORES_CACHE_ENTRIES = 4;
const MAX_PREPARED_VALORES_CACHE_ENTRIES = 8;

type DashboardDataCacheEntry = {
  mode: DashboardDataMode;
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

type TimedCacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type SourceValoresData = {
  rows: ValoresEntregador[];
};

const sourceValoresCache = new Map<string, TimedCacheEntry<SourceValoresData>>();
const inFlightSourceValores = new Map<string, Promise<SourceValoresData>>();
const preparedValoresCache = new Map<string, TimedCacheEntry<PreparedValoresData>>();
const inFlightPreparedValores = new Map<string, Promise<PreparedValoresData>>();

function getCacheKey(mode: DashboardDataMode, payload: Record<string, unknown>) {
  return createRequestKey({ mode, payload });
}

function getCachedData(cacheKey: string) {
  const entry = dashboardDataCache.get(cacheKey);
  const now = Date.now();

  if (entry && entry.expiresAt > now) {
      dashboardDataCache.delete(cacheKey);
      dashboardDataCache.set(cacheKey, entry);
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
  const now = Date.now();
  const modeLimit = MAX_CACHE_ENTRIES_BY_MODE[mode];
  dashboardDataCache.delete(cacheKey);

  if (modeLimit) {
      let entriesForMode = 0;

      for (const [key, entry] of dashboardDataCache.entries()) {
          if (entry.expiresAt <= now) {
              dashboardDataCache.delete(key);
              continue;
          }
          if (entry.mode === mode) entriesForMode++;
      }

      while (entriesForMode >= modeLimit) {
          const oldestKeyForMode = Array.from(dashboardDataCache.entries())
              .find(([, entry]) => entry.mode === mode)?.[0];
          if (!oldestKeyForMode) break;
          dashboardDataCache.delete(oldestKeyForMode);
          entriesForMode--;
      }
  }

  dashboardDataCache.set(cacheKey, {
      mode,
      data,
      expiresAt: now + CACHE_TTL_BY_MODE_MS[mode],
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

async function resolveCachedValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  inFlight: Map<string, Promise<T>>,
  cacheKey: string,
  ttlMs: number,
  maxEntries: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
      cache.delete(cacheKey);
      cache.set(cacheKey, cached);
      return cached.data;
  }

  if (cached) cache.delete(cacheKey);

  const existingRequest = inFlight.get(cacheKey);
  if (existingRequest) return existingRequest;

  const request = fetcher();
  inFlight.set(cacheKey, request);

  try {
      const data = await request;
      while (cache.size >= maxEntries) {
          const oldestKey = cache.keys().next().value as string | undefined;
          if (!oldestKey) break;
          cache.delete(oldestKey);
      }
      cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + ttlMs,
      });
      return data;
  } finally {
      if (inFlight.get(cacheKey) === request) {
          inFlight.delete(cacheKey);
      }
  }
}

function filterPreparedValoresRows(
  rows: ValoresEntregador[],
  search: string,
  sortField: keyof ValoresEntregador,
  sortDirection: 'asc' | 'desc',
) {
  // normalizeValoresEntregadores already orders rows by total_taxas DESC with
  // the same stable name/ID tie-breakers. Filtering preserves that order, so
  // the common default view does not need another O(n log n) sort.
  if (sortField === 'total_taxas' && sortDirection === 'desc') {
      const normalizedSearch = search.trim().toLowerCase();
      if (!normalizedSearch) return rows;
      return rows.filter((row) =>
          `${row.nome_entregador || ''} ${row.id_entregador || ''}`.toLowerCase().includes(normalizedSearch)
      );
  }

  return filterAndSortValores(rows, {
      searchTerm: search,
      sortField,
      sortDirection,
  });
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

function canUseInMemoryEntregadoresPage(payload: Record<string, unknown>) {
  if (
      !UUID_RE.test(String(payload.p_organization_id || ''))
      || payload.p_only_dedicados === true
  ) return false;

  const requestedWeek = Number(payload.p_semana || 0);
  const selectedWeeks = Array.isArray(payload.p_semanas) ? payload.p_semanas : [];
  const hasWeekSelection = requestedWeek !== 0 || selectedWeeks.length > 0;
  const hasValidWeekSelection =
      (requestedWeek === 0 || (Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= 53))
      && selectedWeeks.every((week) => {
          const number = Number(week);
          return Number.isInteger(number) && number >= 1 && number <= 53;
      });

  const hasStartDate = payload.p_data_inicial !== null && payload.p_data_inicial !== undefined;
  const hasEndDate = payload.p_data_final !== null && payload.p_data_final !== undefined;
  if (hasStartDate !== hasEndDate || (hasStartDate && hasWeekSelection) || !hasValidWeekSelection) return false;

  if (!hasStartDate) {
      const year = Number(payload.p_ano);
      return Number.isInteger(year) && year >= 2000 && year <= 2100;
  }

  const start = Date.parse(`${String(payload.p_data_inicial)}T00:00:00Z`);
  const end = Date.parse(`${String(payload.p_data_final)}T00:00:00Z`);
  const days = (end - start) / 86_400_000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || days < 0) return false;
  if (days <= 366) return true;

  // Broad all-years requests can reuse the cached aggregate source and do the
  // page/search/sort work in memory. Long ranges are fetched in indexed yearly
  // slices below, including when a dimension filter narrows each slice.
  return days <= MAX_BROAD_IN_MEMORY_ENTREGADORES_RANGE_DAYS;
}

function normalizeEntregadoresRows(value: unknown): Entregador[] {
  let rawRows: unknown[] | null = null;
  let declaredTotal: number | null = null;
  let sourceData = value;

  if (Array.isArray(sourceData) && sourceData.length > 0) sourceData = sourceData[0];
  if (sourceData && typeof sourceData === 'object' && !Array.isArray(sourceData)) {
      const wrapped = sourceData as Record<string, unknown>;
      if ('listar_entregadores_dashboard_fast_v1' in wrapped) {
          sourceData = wrapped.listar_entregadores_dashboard_fast_v1;
      }
  }

  if (Array.isArray(sourceData)) {
      rawRows = sourceData;
  } else if (sourceData && typeof sourceData === 'object') {
      const result = sourceData as Record<string, unknown>;
      rawRows = Array.isArray(result.entregadores) ? result.entregadores : null;
      const total = Number(result.total);
      if (Number.isSafeInteger(total) && total >= 0) declaredTotal = total;
  }

  if (!rawRows) throw new Error('A RPC de Entregadores respondeu em um formato inválido.');

  const seenIds = new Set<string>();
  const rows = rawRows.map((rawRow) => {
      if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
          throw new Error('A RPC de Entregadores retornou uma linha inválida.');
      }

      const row = rawRow as Record<string, unknown>;
      const id = String(row.id_entregador ?? '').trim();
      if (!id || seenIds.has(id)) {
          throw new Error('A RPC de Entregadores retornou um identificador ausente ou repetido.');
      }
      seenIds.add(id);

      const toNumber = (field: string) => {
          const rawNumber = row[field];
          if (rawNumber === null || rawNumber === undefined || rawNumber === '') return 0;
          const parsed = Number(rawNumber);
          if (!Number.isFinite(parsed)) throw new Error('A RPC de Entregadores retornou uma métrica inválida.');
          return parsed;
      };

      return {
          ...row,
          id_entregador: id,
          nome_entregador: String(row.nome_entregador || id).trim() || id,
          corridas_ofertadas: toNumber('corridas_ofertadas'),
          corridas_aceitas: toNumber('corridas_aceitas'),
          corridas_rejeitadas: toNumber('corridas_rejeitadas'),
          corridas_completadas: toNumber('corridas_completadas'),
          total_segundos: toNumber('total_segundos'),
          aderencia_percentual: toNumber('aderencia_percentual'),
          rejeicao_percentual: toNumber('rejeicao_percentual'),
          primeira_data_aparicao: typeof row.primeira_data_aparicao === 'string' ? row.primeira_data_aparicao : null,
      } as Entregador;
  });

  if (declaredTotal !== null && declaredTotal !== rows.length) {
      throw new Error('A RPC de Entregadores retornou uma lista incompleta.');
  }

  return rows;
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

const DAY_MS = 86_400_000;
const ENTREGADORES_RANGE_CHUNK_CONCURRENCY = 3;
const MAX_SINGLE_YEAR_ENTREGADORES_CHUNK_DAYS = 30;

function splitEntregadoresDateRange(payload: Record<string, unknown>) {
  if (typeof payload.p_data_inicial !== 'string' || typeof payload.p_data_final !== 'string') return [];
  if (payload.p_semana != null || (Array.isArray(payload.p_semanas) && payload.p_semanas.length > 0)) return [];

  const start = Date.parse(`${payload.p_data_inicial}T00:00:00.000Z`);
  const end = Date.parse(`${payload.p_data_final}T00:00:00.000Z`);
  const days = (end - start) / DAY_MS;
  if (!Number.isFinite(start) || !Number.isFinite(end) || days <= MAX_SINGLE_YEAR_ENTREGADORES_CHUNK_DAYS || days > MAX_BROAD_IN_MEMORY_ENTREGADORES_RANGE_DAYS) {
      return [];
  }

  const chunks: Array<{ start: string; end: string }> = [];
  let cursor = start;
  const startYear = new Date(start).getUTCFullYear();
  const endYear = new Date(end).getUTCFullYear();

  // A full calendar year can still be a single expensive RPC. Split ranges
  // within one year by month so indexed date scopes stay smaller and a
  // transient timeout does not fail the entire Entregadores page.
  if (startYear === endYear) {
      while (cursor <= end) {
          const current = new Date(cursor);
          const year = current.getUTCFullYear();
          const lastDayOfMonth = Date.UTC(year, current.getUTCMonth() + 1, 0);
          const chunkEnd = Math.min(lastDayOfMonth, end);
          chunks.push({
              start: new Date(cursor).toISOString().slice(0, 10),
              end: new Date(chunkEnd).toISOString().slice(0, 10),
          });
          cursor = chunkEnd + DAY_MS;
      }

      return chunks.length > 1 ? chunks : [];
  }

  // Preserve the existing calendar-year chunks for multi-year scopes.
  if (days <= 366) return [];

  while (cursor <= end) {
      const year = new Date(cursor).getUTCFullYear();
      const lastDayOfYear = Date.UTC(year, 11, 31);
      const chunkEnd = Math.min(lastDayOfYear, end);
      chunks.push({
          start: new Date(cursor).toISOString().slice(0, 10),
          end: new Date(chunkEnd).toISOString().slice(0, 10),
      });
      cursor = chunkEnd + DAY_MS;
  }

  return chunks.length > 1 ? chunks : [];
}

function toDashboardRpcError(error: { message: string; code?: string }) {
  const rpcError = new Error(error.message) as Error & { code?: string };
  rpcError.name = 'DashboardRpcError';
  if (typeof error.code === 'string') rpcError.code = error.code;
  return rpcError;
}

function chooseChunkedEntregadorName(current: string, next: string) {
  const currentIsMojibake = /[\u00C2\u00C3]/.test(current);
  const nextIsMojibake = /[\u00C2\u00C3]/.test(next);
  if (currentIsMojibake && !nextIsMojibake) return next;
  if (!currentIsMojibake && nextIsMojibake) return current;
  return next.length > current.length ? next : current;
}

function mergeChunkedEntregadoresResults(results: unknown[], payload: Record<string, unknown>) {
  const rowsById = new Map<string, Entregador>();

  for (const result of results) {
      for (const row of normalizeEntregadoresRows(result)) {
          const current = rowsById.get(row.id_entregador);
          if (!current) {
              rowsById.set(row.id_entregador, { ...row });
              continue;
          }

          current.nome_entregador = chooseChunkedEntregadorName(current.nome_entregador, row.nome_entregador);
          current.corridas_ofertadas += row.corridas_ofertadas;
          current.corridas_aceitas += row.corridas_aceitas;
          current.corridas_rejeitadas += row.corridas_rejeitadas;
          current.corridas_completadas += row.corridas_completadas;
          current.total_segundos += row.total_segundos;
          if (row.primeira_data_aparicao && (!current.primeira_data_aparicao || row.primeira_data_aparicao < current.primeira_data_aparicao)) {
              current.primeira_data_aparicao = row.primeira_data_aparicao;
          }
          current.aderencia_percentual = current.corridas_ofertadas > 0
              ? Number(((current.corridas_aceitas / current.corridas_ofertadas) * 100).toFixed(2))
              : 0;
          current.rejeicao_percentual = current.corridas_ofertadas > 0
              ? Number(((current.corridas_rejeitadas / current.corridas_ofertadas) * 100).toFixed(2))
              : 0;
      }
  }

  const entregadores = Array.from(rowsById.values());
  entregadores.sort((left, right) =>
      right.corridas_completadas - left.corridas_completadas
      || compareText(left.id_entregador, right.id_entregador)
  );

  return {
      entregadores,
      total: entregadores.length,
      periodo_resolvido: {
          ano: null,
          semana: null,
          semanas: [],
          auto_semana: false,
          search: typeof payload.p_search === 'string' ? payload.p_search.trim() || null : null,
      },
  };
}

async function fetchEntregadoresInDateChunks(
  admin: ReturnType<typeof createServiceRoleClient>,
  payload: Record<string, unknown>,
  chunks: Array<{ start: string; end: string }>,
) {
  const results = new Array<unknown>(chunks.length);
  const failures: Error[] = [];
  let nextChunkIndex = 0;

  const worker = async () => {
      while (failures.length === 0) {
          const chunkIndex = nextChunkIndex++;
          if (chunkIndex >= chunks.length) return;

          const chunkPayload = {
              ...payload,
              p_data_inicial: chunks[chunkIndex].start,
              p_data_final: chunks[chunkIndex].end,
              p_semana: null,
              p_semanas: null,
          };
          const { data, error } = await admin.rpc('listar_entregadores_dashboard_fast_v1', chunkPayload);
          if (error) {
              failures.push(toDashboardRpcError(error));
              return;
          }
          results[chunkIndex] = data ?? null;
      }
  };

  await Promise.all(
      Array.from(
          { length: Math.min(ENTREGADORES_RANGE_CHUNK_CONCURRENCY, chunks.length) },
          () => worker()
      )
  );

  if (failures.length > 0) throw failures[0];
  return mergeChunkedEntregadoresResults(results, payload);
}

function getEntregadorSortValue(row: Entregador, field: EntregadoresSortField) {
  if (field === 'percentual_aceitas') {
      return row.corridas_ofertadas > 0 ? (row.corridas_aceitas * 100) / row.corridas_ofertadas : 0;
  }
  if (field === 'percentual_completadas') {
      return row.corridas_aceitas > 0 ? (row.corridas_completadas * 100) / row.corridas_aceitas : 0;
  }
  return row[field] ?? 0;
}

function sortEntregadoresRows(
  rows: Entregador[],
  field: EntregadoresSortField,
  direction: 'asc' | 'desc',
) {
  const sign = direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
      if (field === 'id_entregador') {
          const leftId = left.id_entregador;
          const rightId = right.id_entregador;
          const leftNumeric = /^\d+$/.test(leftId);
          const rightNumeric = /^\d+$/.test(rightId);
          if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
          if (leftNumeric && rightNumeric) {
              const a = BigInt(leftId);
              const b = BigInt(rightId);
              return (a < b ? -1 : a > b ? 1 : 0) * sign || compareText(leftId, rightId);
          }
          return compareText(leftId.toLowerCase(), rightId.toLowerCase()) * sign || compareText(leftId, rightId);
      }

      const leftValue = getEntregadorSortValue(left, field);
      const rightValue = getEntregadorSortValue(right, field);
      const primary = typeof leftValue === 'string' && typeof rightValue === 'string'
          ? compareText(leftValue.toLowerCase(), rightValue.toLowerCase())
          : Number(leftValue) - Number(rightValue);
      return primary * sign || compareText(left.id_entregador, right.id_entregador);
  });
}

function buildEntregadoresPage(
  sourceValue: unknown,
  payload: Record<string, unknown>,
) {
  const allRows = normalizeEntregadoresRows(sourceValue);
  const search = typeof payload.p_search === 'string' ? payload.p_search.trim().toLowerCase() : '';
  const filteredRows = allRows.filter((row) =>
      (!search || `${row.nome_entregador} ${row.id_entregador}`.toLowerCase().includes(search))
      && (payload.p_only_inactive !== true || row.corridas_completadas === 0)
  );
  const total = filteredRows.length;
  const requestedLimit = Number(payload.p_limit);
  const limit = Number.isInteger(requestedLimit) ? requestedLimit : -1;
  const page = normalizePositiveInteger(payload.p_page, 1, 1_000_000) || 1;
  const pageSize = limit === -1
      ? total > 1_000 ? 24 : total > 400 ? 35 : 50
      : limit;
  const requestedField = typeof payload.p_sort_field === 'string'
      ? payload.p_sort_field as EntregadoresSortField
      : 'aderencia_percentual';
  const sortField = ENTREGADORES_PAGE_SORT_FIELDS.has(requestedField) ? requestedField : 'aderencia_percentual';
  const sortDirection = payload.p_sort_direction === 'asc' ? 'asc' : 'desc';
  const sortedRows = sortEntregadoresRows(filteredRows, sortField, sortDirection);
  const pageRows = limit === 0 ? sortedRows : sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const sum = (field: 'corridas_completadas' | 'total_segundos') => filteredRows.reduce((totalValue, row) => totalValue + row[field], 0);
  const average = (field: 'aderencia_percentual' | 'rejeicao_percentual') =>
      total > 0 ? filteredRows.reduce((totalValue, row) => totalValue + row[field], 0) / total : 0;
  const performers = (
      field: 'aderencia_percentual' | 'corridas_completadas' | 'total_segundos' | 'rejeicao_percentual',
      bottomFirst = false,
  ) => {
      const direction = bottomFirst ? 'asc' : 'desc';
      const ordered = [...filteredRows].sort((left, right) =>
          (left[field] - right[field]) * (direction === 'asc' ? 1 : -1)
          || compareText(left.id_entregador, right.id_entregador)
      );
      return { top: ordered.slice(0, 10), bottom: ordered.slice(-10).reverse() };
  };

  const sourceData = sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)
      ? sourceValue as Record<string, unknown>
      : {};
  const resolvedPeriod = sourceData.periodo_resolvido && typeof sourceData.periodo_resolvido === 'object'
      ? sourceData.periodo_resolvido
      : {};

  return {
      entregadores: pageRows,
      total,
      page,
      page_size: pageSize,
      periodo_resolvido: {
          ...resolvedPeriod,
          search: search.length >= 3 ? search : null,
      },
      summary: {
          total_entregadores: total,
          aderencia_media: average('aderencia_percentual'),
          rejeicao_media: average('rejeicao_percentual'),
          corridas_completadas: sum('corridas_completadas'),
          total_segundos: sum('total_segundos'),
      },
      performers_by_metric: {
          aderencia: performers('aderencia_percentual'),
          completadas: performers('corridas_completadas'),
          horas: performers('total_segundos'),
          rejeicao: performers('rejeicao_percentual', true),
      },
  };
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
      const forceFullSource = source.p_force_full_source === true;
      const useFastAnnualPageRpc = !forceFullSource
          && search === ''
          && canUseAggregatedValoresSource(valoresPayload)
          && valoresPayload.p_semana == null
          && sortField === 'total_taxas'
          && sortDirection === 'desc';
      const pageCachePayload = {
          ...valoresPayload,
          p_limit: limit,
          p_offset: offset,
          p_search: search,
          p_sort_field: sortField,
          p_sort_direction: sortDirection,
          p_snapshot: expectedSnapshot,
      };
      const versionedPageCachePayload = {
          ...pageCachePayload,
          p_page_engine: useFastAnnualPageRpc ? 'annual-db-page-v1' : 'memory-page-v1',
          p_force_full_source: forceFullSource,
      };
      const sourceCacheKey = createRequestKey({ mode: 'valores_source', payload: valoresPayload });
      const preparedCacheKey = createRequestKey({
          mode: 'valores_prepared',
          snapshotVersion: 'jsonb-array-v1',
          ...valoresPayload,
          search,
          sortField,
          sortDirection,
      });

      return resolveWithCache('valores_page', versionedPageCachePayload, async () => {
          if (useFastAnnualPageRpc) {
              const { data, error } = await createServiceRoleClient().rpc(
                  'listar_valores_entregadores_page_fast_v1',
                  pageCachePayload,
              );
              if (error) {
                  const rpcError = new Error(error.message) as Error & { code?: string };
                  rpcError.name = 'DashboardRpcError';
                  if (typeof error.code === 'string') rpcError.code = error.code;
                  throw rpcError;
              }
              return data ?? null;
          }

          const source = await resolveCachedValue(
              sourceValoresCache,
              inFlightSourceValores,
              sourceCacheKey,
              SOURCE_VALORES_CACHE_TTL_MS,
              MAX_SOURCE_VALORES_CACHE_ENTRIES,
              async () => {
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

                  return { rows: normalizeValoresEntregadores(rawRows as ValoresEntregador[]) };
              }
          );

          const prepared = await resolveCachedValue(
              preparedValoresCache,
              inFlightPreparedValores,
              preparedCacheKey,
              PREPARED_VALORES_CACHE_TTL_MS,
              MAX_PREPARED_VALORES_CACHE_ENTRIES,
              async () => {
                  const rows = filterPreparedValoresRows(source.rows, search, sortField, sortDirection);
                  const snapshotHasher = createHash('sha256');
                  let totalCorridas = 0;
                  let totalGeral = 0;

                  for (const row of rows) {
                      const totalTaxas = Number(row.total_taxas) || 0;
                      const corridasAceitas = Number(row.numero_corridas_aceitas) || 0;
                      snapshotHasher.update(`[${JSON.stringify(row.id_entregador)}, ${JSON.stringify(row.nome_entregador || '')}, ${totalTaxas.toFixed(2)}, ${String(corridasAceitas)}]\n`);
                      totalCorridas += Number(row.numero_corridas_aceitas) || 0;
                      totalGeral += Number(row.total_taxas) || 0;
                  }

                  return {
                      rows,
                      totalCorridas,
                      totalGeral: Math.round(totalGeral * 100) / 100,
                      snapshot: snapshotHasher.digest('hex'),
                  };
              }
          );

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

  if (mode === 'entregadores_page' && canUseInMemoryEntregadoresPage(payload)) {
      // Reuse a cached aggregate source for search, sorting, filters and page
      // changes. The direct SQL page RPC re-aggregates and ranks the whole
      // annual scope on every request and can exceed the database timeout.
      const sourcePayload = pickPayload(source, ENTREGADORES_ALLOWED_PARAMS);
      sourcePayload.p_organization_id = organizationId;
      delete sourcePayload.p_search;

      return resolveWithCache(mode, payload, async () => {
          const fullResult = await fetchDashboardData('entregadores', sourcePayload, organizationId) as { data?: unknown };
          if (fullResult?.data === null || fullResult?.data === undefined) {
              throw new Error('A consulta de Entregadores não retornou dados.');
          }
          return buildEntregadoresPage(fullResult.data, payload);
      });
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
      if (mode === 'entregadores') {
          const chunks = splitEntregadoresDateRange(payload);
          if (chunks.length > 1) {
              return fetchEntregadoresInDateChunks(admin, payload, chunks);
          }
      }

      const { data: rpcData, error } = await admin.rpc(rpcName, payload);
      if (error) {
          throw toDashboardRpcError(error);
      }
      return rpcData ?? null;
  });
}
