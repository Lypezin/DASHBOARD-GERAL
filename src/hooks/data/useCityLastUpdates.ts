import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

let globalCache: CityUpdateInfo[] | null = null;
let globalPromise: Promise<CityUpdateInfo[] | null> | null = null;
let globalCacheTime = 0;

const CACHE_TTL = 30 * 60 * 1000;
const SESSION_CACHE_KEY = 'city_last_updates_cache_v2';

function readSessionCache() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { timestamp: number; data: CityUpdateInfo[] };
    if (Date.now() - parsed.timestamp > CACHE_TTL || !Array.isArray(parsed.data)) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    return null;
  }
}

function writeSessionCache(data: CityUpdateInfo[]) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Cache opcional.
  }
}

export function useCityLastUpdates() {
  const sessionCacheRef = useRef(readSessionCache());
  const initialCache = globalCache || sessionCacheRef.current?.data || [];

  const [data, setData] = useState<CityUpdateInfo[]>(initialCache);
  const [loading, setLoading] = useState(initialCache.length === 0);

  useEffect(() => {
    let mounted = true;

    async function fetchUpdates() {
      const sessionCache = sessionCacheRef.current;

      if (!globalCache && sessionCache?.data) {
        globalCache = sessionCache.data;
        globalCacheTime = sessionCache.timestamp;
      }

      if (globalCache && Date.now() - globalCacheTime < CACHE_TTL) {
        if (mounted) {
          setData(globalCache);
          setLoading(false);
        }
        return;
      }

      if (!globalPromise) {
        globalPromise = (async () => {
          try {
            const { data, error } = await supabase.rpc('get_city_last_updates');
            if (error) {
              safeLog.error('Error fetching city updates:', error);
              globalPromise = null;
              return null;
            }

            if (data) {
              globalCache = data as CityUpdateInfo[];
              globalCacheTime = Date.now();
              writeSessionCache(globalCache);
            }

            globalPromise = null;
            return globalCache;
          } catch (err: unknown) {
            safeLog.error('Unexpected error fetching updates:', err);
            globalPromise = null;
            return null;
          }
        })();
      }

      if (mounted) setLoading(true);
      const result = await globalPromise;

      if (mounted) {
        if (result) setData(result);
        setLoading(false);
      }
    }

    void fetchUpdates();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
}
