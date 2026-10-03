import { useEffect, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

const globalCache = new Map<string, { data: CityUpdateInfo[]; timestamp: number }>();
const globalPromises = new Map<string, Promise<CityUpdateInfo[] | null>>();

const CACHE_TTL = 30 * 60 * 1000;
const SESSION_CACHE_KEY_PREFIX = 'city_last_updates_cache_v4';

function getSessionCacheKey(scopeKey: string) {
  return `${SESSION_CACHE_KEY_PREFIX}:${scopeKey}`;
}

function readSessionCache(scopeKey: string) {
  if (typeof window === 'undefined') return null;

  const cacheKey = getSessionCacheKey(scopeKey);
  const parsed = readJsonStorage<{ timestamp: number; data: CityUpdateInfo[] } | null>(sessionStorage, cacheKey, null);
  if (!parsed) return null;

  if (Date.now() - parsed.timestamp > CACHE_TTL || !Array.isArray(parsed.data)) {
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
}

export function useCityLastUpdates() {
  const { hasResolved, isAuthenticated, profile, currentUser } = useAppBootstrap();
  const scopeKey = createAccessScopeKey(currentUser, profile?.organization_id) || 'no-user';
  const sessionCacheRef = useRef<{ scopeKey: string; value: ReturnType<typeof readSessionCache> } | null>(null);
  const cachedEntry = globalCache.get(scopeKey);
  const sessionCache = sessionCacheRef.current?.scopeKey === scopeKey
    ? sessionCacheRef.current.value
    : readSessionCache(scopeKey);

  if (!sessionCacheRef.current || sessionCacheRef.current.scopeKey !== scopeKey) {
    sessionCacheRef.current = { scopeKey, value: sessionCache };
  }

  const initialCache = cachedEntry?.data || sessionCache?.data || [];
  const hasFreshInitialCache = Boolean(
    (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL)
    || sessionCache
  );

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

      if (!globalCache.has(scopeKey) && currentSessionCache?.data) {
        globalCache.set(scopeKey, {
          data: currentSessionCache.data,
          timestamp: currentSessionCache.timestamp,
        });
      }

      const currentCache = globalCache.get(scopeKey);
      if (currentCache && Date.now() - currentCache.timestamp < CACHE_TTL) {
        if (mounted) {
          setData(currentCache.data);
          setDataScopeKey(scopeKey);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setData(currentCache?.data || []);
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
              globalCache.set(scopeKey, {
                data: nextData,
                timestamp: Date.now(),
              });
              writeSessionCache(scopeKey, nextData);
            }

            globalPromises.delete(scopeKey);
            return globalCache.get(scopeKey)?.data || null;
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
