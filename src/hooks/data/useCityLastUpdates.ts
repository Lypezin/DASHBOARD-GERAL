import { useEffect, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

const globalCache = new Map<string, { data: CityUpdateInfo[]; timestamp: number }>();
const globalPromises = new Map<string, Promise<CityUpdateInfo[] | null>>();

const CACHE_TTL = 30 * 60 * 1000;
const SESSION_CACHE_KEY_PREFIX = 'city_last_updates_cache_v3';

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
  const { hasResolved, isAuthenticated, profile } = useAppBootstrap();
  const scopeKey = profile?.organization_id || 'no-org';
  const sessionCacheRef = useRef<{ scopeKey: string; value: ReturnType<typeof readSessionCache> } | null>(null);
  const cachedEntry = globalCache.get(scopeKey);
  const sessionCache = sessionCacheRef.current?.scopeKey === scopeKey
    ? sessionCacheRef.current.value
    : readSessionCache(scopeKey);

  if (!sessionCacheRef.current || sessionCacheRef.current.scopeKey !== scopeKey) {
    sessionCacheRef.current = { scopeKey, value: sessionCache };
  }

  const initialCache = cachedEntry?.data || sessionCache?.data || [];

  const [data, setData] = useState<CityUpdateInfo[]>(initialCache);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchUpdates() {
      if (!hasResolved || !isAuthenticated) {
        if (mounted) {
          setData([]);
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
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setData([]);
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
        setLoading(false);
      }
    }

    void fetchUpdates();

    return () => {
      mounted = false;
    };
  }, [hasResolved, isAuthenticated, scopeKey]);

  return { data, loading };
}
