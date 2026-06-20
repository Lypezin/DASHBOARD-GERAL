import { safeRpc } from '@/lib/rpcWrapper';

const ALL_WEEKS_CACHE_KEY = 'all-weeks';
const ALL_WEEKS_STORAGE_KEY = 'dashboard_all_weeks_cache_v1';
const ALL_WEEKS_CACHE_TTL_MS = 1000 * 60 * 60;
const allWeeksCache = new Map<string, string[]>();
const allWeeksRequests = new Map<string, Promise<string[]>>();

function hasYearQualifiedWeeks(weeks: string[]) {
  return weeks.some((week) => /^\d{4}-W\d{1,2}$/.test(week));
}

function readStoredAllWeeks() {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(ALL_WEEKS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { timestamp?: number; weeks?: unknown };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > ALL_WEEKS_CACHE_TTL_MS) {
      sessionStorage.removeItem(ALL_WEEKS_STORAGE_KEY);
      return null;
    }

    if (!Array.isArray(parsed.weeks)) return null;
    const weeks = parsed.weeks.map(String).filter(Boolean);
    if (weeks.length === 0) return null;

    allWeeksCache.set(ALL_WEEKS_CACHE_KEY, weeks);
    writeStoredAllWeeks(weeks);
    return weeks;
  } catch {
    sessionStorage.removeItem(ALL_WEEKS_STORAGE_KEY);
    return null;
  }
}

function writeStoredAllWeeks(weeks: string[]) {
  if (typeof sessionStorage === 'undefined') return;

  try {
    sessionStorage.setItem(ALL_WEEKS_STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      weeks,
    }));
  } catch {
    // Cache local opcional; falhas nao devem afetar filtros.
  }
}
function normalizeAllWeeks(data: unknown): string[] {
  let semanasArray: unknown[] = [];

  if (Array.isArray(data)) {
    semanasArray = data;
  } else if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    semanasArray = Array.isArray(payload.listar_todas_semanas)
      ? payload.listar_todas_semanas
      : Array.isArray(payload.semanas)
        ? payload.semanas
        : [];
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

export function primeAllWeeksCache(weeks: string[]) {
  if (Array.isArray(weeks) && weeks.length > 0) {
    allWeeksCache.set(ALL_WEEKS_CACHE_KEY, weeks);
    writeStoredAllWeeks(weeks);
  }
}

export function getAllWeeksCache(requireYearQualified = false) {
  const cached = allWeeksCache.get(ALL_WEEKS_CACHE_KEY) || readStoredAllWeeks();
  if (!cached) return null;
  if (requireYearQualified && !hasYearQualifiedWeeks(cached)) return null;
  return cached;
}

export async function fetchAllWeeks(): Promise<string[]> {
  const cached = getAllWeeksCache(true);
  if (cached) return cached;

  const activeRequest = allWeeksRequests.get(ALL_WEEKS_CACHE_KEY);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await safeRpc<unknown>('listar_todas_semanas', {}, {
      timeout: 30000,
      validateParams: false,
    });

    if (error) {
      throw error;
    }

    const normalized = normalizeAllWeeks(data);
    if (normalized.length > 0) {
      primeAllWeeksCache(normalized);
    }

    return normalized;
  })().finally(() => {
    allWeeksRequests.delete(ALL_WEEKS_CACHE_KEY);
  });

  allWeeksRequests.set(ALL_WEEKS_CACHE_KEY, request);
  return request;
}
