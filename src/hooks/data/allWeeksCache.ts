import { safeRpc } from '@/lib/rpcWrapper';

const ALL_WEEKS_CACHE_KEY = 'all-weeks';
const allWeeksCache = new Map<string, string[]>();
const allWeeksRequests = new Map<string, Promise<string[]>>();

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
  }
}

export function getAllWeeksCache() {
  return allWeeksCache.get(ALL_WEEKS_CACHE_KEY) || null;
}

export async function fetchAllWeeks(): Promise<string[]> {
  const cached = getAllWeeksCache();
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
