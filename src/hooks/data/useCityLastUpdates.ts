import { useEffect, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import {
  getTimedCacheValue,
  rememberTimedCacheEntry,
  setTimedCacheValue,
  type TimedCacheEntry,
} from '@/utils/cache/timedLruCache';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

const CACHE_TTL = 30 * 60 * 1000;
const CITY_UPDATES_STALE_TTL = 24 * 60 * 60 * 1000;
const CITY_UPDATES_CACHE_POLICY = { ttlMs: CACHE_TTL, staleTtlMs: CITY_UPDATES_STALE_TTL, maxEntries: 12 } as const;
const SESSION_CACHE_MAX_ENTRIES = 12;
const globalCache = new Map<string, TimedCacheEntry<CityUpdateInfo[]>>();
const globalPromises = new Map<string, Promise<CityUpdateInfo[] | null>>();

const SESSION_CACHE_KEY_PREFIX = 'city_last_updates_cache_v4';

function getSessionCacheKey(scopeKey: string) {
  return `${SESSION_CACHE_KEY_PREFIX}:${scopeKey}`;
}

function readSessionCache(scopeKey: string) {
  if (typeof window === 'undefined') return null;

  const cacheKey = getSessionCacheKey(scopeKey);
  const parsed = readJsonStorage<{ timestamp: number; data: CityUpdateInfo[] } | null>(sessionStorage, cacheKey, null);
  if (!parsed) return null;

  if (!Number.isFinite(parsed.timestamp) || !Array.isArray(parsed.data)
    || Date.now() - parsed.timestamp > CITY_UPDATES_STALE_TTL) {
    removeJsonStorage(sessionStorage, cacheKey);
    return null;
  }

  return parsed;
}

function writeSessionCache(scopeKey: string, data: CityUpdateInfo[]) {
  if (typeof window === 'undefined') return;

  writeJsonStorage(sessionStorage, getSessionCacheKey(scopeKey), {
    timestamp: Date.now(),
    data,
  });
  pruneSessionCache();
}

function pruneSessionCache() {
  if (typeof window === 'undefined') return;

  try {
    const validEntries: Array<{ key: string; timestamp: number }> = [];
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(`${SESSION_CACHE_KEY_PREFIX}:`)) continue;

      const entry = readJsonStorage<{ timestamp?: number; data?: unknown } | null>(sessionStorage, key, null);
      if (!entry || !Number.isFinite(entry.timestamp) || !Array.isArray(entry.data)
        || Date.now() - Number(entry.timestamp) > CITY_UPDATES_STALE_TTL) {
        removeJsonStorage(sessionStorage, key);
        continue;
      }

      validEntries.push({ key, timestamp: Number(entry.timestamp) });
    }

    validEntries.sort((a, b) => b.timestamp - a.timestamp);
    for (const entry of validEntries.slice(SESSION_CACHE_MAX_ENTRIES)) {
      removeJsonStorage(sessionStorage, entry.key);
    }
  } catch {
    // Storage is optional; privacy/quota errors must not block the dashboard.
  }
}

export function useCityLastUpdates() {
  const { hasResolved, isAuthenticated, profile, currentUser } = useAppBootstrap();
  const scopeKey = createAccessScopeKey(currentUser, profile?.organization_id) || 'no-user';
  const sessionCacheRef = useRef<{ scopeKey: string; value: ReturnType<typeof readSessionCache> } | null>(null);
  const cachedData = getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY);
  const staleCachedData = cachedData
    || getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY, true);
  const sessionCache = sessionCacheRef.current?.scopeKey === scopeKey
    ? sessionCacheRef.current.value
    : readSessionCache(scopeKey);

  if (!sessionCacheRef.current || sessionCacheRef.current.scopeKey !== scopeKey) {
    sessionCacheRef.current = { scopeKey, value: sessionCache };
  }

  const initialCache = staleCachedData || sessionCache?.data || [];
  const hasFreshSessionCache = Boolean(sessionCache && Date.now() - sessionCache.timestamp <= CACHE_TTL);
  const hasFreshInitialCache = Boolean(cachedData || hasFreshSessionCache);

  const [data, setData] = useState<CityUpdateInfo[]>(initialCache);
  const [dataScopeKey, setDataScopeKey] = useState<string | null>(hasFreshInitialCache ? scopeKey : null);
  const [loading, setLoading] = useState(false);

  const isScopeReady = hasResolved && isAuthenticated;
  const visibleData = isScopeReady
    ? dataScopeKey === scopeKey ? data : initialCache
    : [];
  const visibleLoading = !hasResolved || (isScopeReady && dataScopeKey !== scopeKey) || loading;

  useEffect(() => {
    let mounted = true;

    async function fetchUpdates() {
      if (!hasResolved || !isAuthenticated) {
        if (mounted) {
          setData([]);
          setDataScopeKey(scopeKey);
          setLoading(false);
        }
        return;
      }

      const currentSessionCache = sessionCacheRef.current?.scopeKey === scopeKey
        ? sessionCacheRef.current.value
        : readSessionCache(scopeKey);

      let freshCache = getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY);
      let visibleCache = freshCache || getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY, true);

      if (currentSessionCache?.data && !visibleCache) {
        rememberTimedCacheEntry(globalCache, scopeKey, {
          data: currentSessionCache.data,
          timestamp: currentSessionCache.timestamp,
        }, CITY_UPDATES_CACHE_POLICY);
        freshCache = getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY);
        visibleCache = freshCache || getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY, true);
      }

      if (freshCache) {
        if (mounted) {
          setData(freshCache);
          setDataScopeKey(scopeKey);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setData(visibleCache || currentSessionCache?.data || []);
        setDataScopeKey(scopeKey);
        setLoading(true);
      }

      if (!globalPromises.has(scopeKey)) {
        globalPromises.set(scopeKey, (async () => {
          try {
            const { data, error } = await getAppApiData<CityUpdateInfo[]>('/api/app/city-updates');
            if (error) {
              safeLog.error('Error fetching city updates:', error);
              globalPromises.delete(scopeKey);
              return null;
            }

            if (data) {
              const nextData = data as CityUpdateInfo[];
              setTimedCacheValue(globalCache, scopeKey, nextData, CITY_UPDATES_CACHE_POLICY);
              writeSessionCache(scopeKey, nextData);
            }

            globalPromises.delete(scopeKey);
            return getTimedCacheValue(globalCache, scopeKey, CITY_UPDATES_CACHE_POLICY);
          } catch (err: unknown) {
            safeLog.error('Unexpected error fetching updates:', err);
            globalPromises.delete(scopeKey);
            return null;
          }
        })());
      }

      const result = await globalPromises.get(scopeKey);

      if (mounted) {
        if (result) setData(result);
        setDataScopeKey(scopeKey);
        setLoading(false);
      }
    }

    void fetchUpdates();

    return () => {
      mounted = false;
    };
  }, [hasResolved, isAuthenticated, scopeKey]);

  return { data: visibleData, loading: visibleLoading };
}
