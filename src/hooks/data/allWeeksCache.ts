import { safeRpc } from '@/lib/rpcWrapper';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import {
  getTimedCacheValue,
  rememberTimedCacheEntry,
  setTimedCacheValue,
  type TimedCacheEntry,
} from '@/utils/cache/timedLruCache';

const ALL_WEEKS_STORAGE_KEY = 'dashboard_all_weeks_cache_v2';
const ALL_WEEKS_CACHE_TTL_MS = 1000 * 60 * 60;
const MAX_ALL_WEEKS_CACHE_ENTRIES = 12;
const MAX_ALL_WEEKS_SESSION_ENTRIES = 12;
const ALL_WEEKS_CACHE_POLICY = { ttlMs: ALL_WEEKS_CACHE_TTL_MS, maxEntries: MAX_ALL_WEEKS_CACHE_ENTRIES } as const;
const allWeeksCache = new Map<string, TimedCacheEntry<string[]>>();
const allWeeksRequests = new Map<string, Promise<string[]>>();

function getAllWeeksCacheKey(organizationId?: string | null) {
  return organizationId || 'global';
}

function getStoredAllWeeksKey(organizationId?: string | null) {
  return `${ALL_WEEKS_STORAGE_KEY}:${getAllWeeksCacheKey(organizationId)}`;
}

function hasYearQualifiedWeeks(weeks: string[]) {
  return weeks.every((week) => /^\d{4}-W\d{1,2}$/.test(week));
}

function readStoredAllWeeks(organizationId?: string | null) {
  if (typeof sessionStorage === 'undefined') return null;

  const parsed = readJsonStorage<{ timestamp?: number; weeks?: unknown } | null>(
    sessionStorage,
    getStoredAllWeeksKey(organizationId),
    null
  );
  if (!parsed) return null;

  if (!Number.isFinite(parsed.timestamp) || Date.now() - Number(parsed.timestamp) > ALL_WEEKS_CACHE_TTL_MS) {
    removeJsonStorage(sessionStorage, getStoredAllWeeksKey(organizationId));
    return null;
  }

  if (!Array.isArray(parsed.weeks)) return null;
  const weeks = parsed.weeks.map(String).filter(Boolean);
  rememberTimedCacheEntry(
    allWeeksCache,
    getAllWeeksCacheKey(organizationId),
    { data: weeks, timestamp: Number(parsed.timestamp) },
    ALL_WEEKS_CACHE_POLICY
  );
  return weeks;
}

function writeStoredAllWeeks(weeks: string[], organizationId?: string | null) {
  if (typeof sessionStorage === 'undefined') return;

  writeJsonStorage(sessionStorage, getStoredAllWeeksKey(organizationId), {
    timestamp: Date.now(),
    weeks,
  });
  pruneStoredAllWeeks();
}

function pruneStoredAllWeeks() {
  if (typeof sessionStorage === 'undefined') return;

  try {
    const validEntries: Array<{ key: string; timestamp: number }> = [];
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(`${ALL_WEEKS_STORAGE_KEY}:`)) continue;

      const entry = readJsonStorage<{ timestamp?: number; weeks?: unknown } | null>(sessionStorage, key, null);
      if (!entry || !Number.isFinite(entry.timestamp) || !Array.isArray(entry.weeks)
        || Date.now() - Number(entry.timestamp) > ALL_WEEKS_CACHE_TTL_MS) {
        removeJsonStorage(sessionStorage, key);
        continue;
      }

      validEntries.push({ key, timestamp: Number(entry.timestamp) });
    }

    validEntries.sort((a, b) => b.timestamp - a.timestamp);
    for (const entry of validEntries.slice(MAX_ALL_WEEKS_SESSION_ENTRIES)) {
      removeJsonStorage(sessionStorage, entry.key);
    }
  } catch {
    // Storage is optional; privacy/quota errors must not block the dashboard.
  }
}

function normalizeAllWeeks(data: unknown): string[] {
  let semanasArray: unknown[] = [];

  if (Array.isArray(data)) {
    semanasArray = data;
  } else if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const semanas = Array.isArray(payload.listar_todas_semanas)
      ? payload.listar_todas_semanas
      : payload.semanas;
    if (!Array.isArray(semanas)) {
      throw new Error('A consulta de semanas respondeu em um formato inválido.');
    }
    semanasArray = semanas;
  } else {
    throw new Error('A consulta de semanas respondeu sem dados válidos.');
  }

  if (semanasArray.length === 0) {
    return [];
  }

  if (typeof semanasArray[0] !== 'object' || semanasArray[0] === null) {
    return semanasArray.map((week) => String(week));
  }

  return (semanasArray as Record<string, unknown>[])
    .map((item) => {
      const ano = item.ano;
      const semana = item.semana || item.semana_numero || item.numero_semana;

      if (ano && semana) {
        return `${ano}-W${semana}`;
      }

      const fallback =
        item.ano_semana ||
        item.semana ||
        item.semana_numero ||
        item.numero_semana;

      return fallback ? String(fallback) : null;
    })
    .filter((week): week is string => Boolean(week));
}

export function primeAllWeeksCache(weeks: string[], organizationId?: string | null) {
  if (Array.isArray(weeks)) {
    setTimedCacheValue(allWeeksCache, getAllWeeksCacheKey(organizationId), weeks, ALL_WEEKS_CACHE_POLICY);
    writeStoredAllWeeks(weeks, organizationId);
  }
}

export function getAllWeeksCache(requireYearQualified = false, organizationId?: string | null) {
  const cacheKey = getAllWeeksCacheKey(organizationId);
  const cached = getTimedCacheValue(allWeeksCache, cacheKey, ALL_WEEKS_CACHE_POLICY);
  if (cached) {
    if (requireYearQualified && !hasYearQualifiedWeeks(cached)) return null;
    return cached;
  }

  const stored = readStoredAllWeeks(organizationId);
  if (!stored) return null;
  if (requireYearQualified && !hasYearQualifiedWeeks(stored)) return null;
  return stored;
}

export async function fetchAllWeeks(organizationId?: string | null): Promise<string[]> {
  const cacheKey = getAllWeeksCacheKey(organizationId);
  const cached = getAllWeeksCache(true, organizationId);
  if (cached) return cached;

  const activeRequest = allWeeksRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await safeRpc<unknown>('listar_todas_semanas', {
      p_organization_id: organizationId || null,
    }, {
      timeout: 30000,
      validateParams: false,
    });

    if (error) {
      throw error;
    }

    const normalized = normalizeAllWeeks(data);
    if (normalized.some((week) => !/^\d{4}-W\d{1,2}$/.test(week))) {
      throw new Error('A consulta de semanas não retornou ano e semana em formato válido.');
    }
    primeAllWeeksCache(normalized, organizationId);

    return normalized;
  })().finally(() => {
    allWeeksRequests.delete(cacheKey);
  });

  allWeeksRequests.set(cacheKey, request);
  return request;
}
