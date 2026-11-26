/**
 * Hook para gerenciar cache de dados.
 * Centraliza memoria + sessionStorage com uma camada global compartilhada
 * entre montagens de guias diferentes.
 */

import { useCallback, useRef } from 'react';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';
import { getFromSessionStorage, setToSessionStorage } from '@/hooks/cache/sessionStorage';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

interface UseCacheOptions<T> {
  ttl?: number;
  getCacheKey: (params: any) => string;
  persistToSession?: boolean;
}

const globalCache = new Map<string, CacheEntry<unknown>>();
const MAX_GLOBAL_CACHE_ENTRIES = 24;
const DEFAULT_TAB_DATA_TTL_MS: number = CACHE.TAB_DATA_TTL;

function touchGlobalCacheEntry(key: string, entry: CacheEntry<unknown>) {
  globalCache.delete(key);
  globalCache.set(key, entry);
}

function pruneGlobalCache(ttl: number): void {
  for (const [key, entry] of globalCache.entries()) {
    if (!isCacheValid(entry, ttl)) {
      globalCache.delete(key);
    }
  }

  while (globalCache.size > MAX_GLOBAL_CACHE_ENTRIES) {
    const oldestKey = globalCache.keys().next().value;
    if (!oldestKey) break;
    globalCache.delete(oldestKey);
  }
}

export function clearSharedCacheByPrefix(prefix: string): void {
  for (const key of globalCache.keys()) {
    if (key.startsWith(prefix)) {
      globalCache.delete(key);
    }
  }
}

export function readSharedCacheEntry<T>(
  key: string,
  ttl: number = DEFAULT_TAB_DATA_TTL_MS,
  readFromSession: boolean = true
): T | null {
  const cached = globalCache.get(key);
  if (cached) {
    if (isCacheValid(cached, ttl)) {
      touchGlobalCacheEntry(key, cached);
      return cached.data as T;
    }
    globalCache.delete(key);
  }

  if (!readFromSession) {
    return null;
  }

  const sessionData = getFromSessionStorage<T>(key, ttl);
  if (sessionData !== null) {
    touchGlobalCacheEntry(key, createCacheEntry(sessionData, ttl) as CacheEntry<unknown>);
    return sessionData;
  }

  return null;
}

export function writeSharedCacheEntry<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TAB_DATA_TTL_MS,
  persistToSession: boolean = true
): void {
  touchGlobalCacheEntry(key, createCacheEntry(data, ttl) as CacheEntry<unknown>);
  pruneGlobalCache(ttl);
  if (persistToSession) {
    scheduleIdleTask(() => setToSessionStorage(key, data, ttl), {
      timeoutMs: 1500,
      fallbackDelayMs: 250,
    });
  }
}

export function useCache<T>(options: UseCacheOptions<T>) {
  const { ttl = DEFAULT_TAB_DATA_TTL_MS, getCacheKey, persistToSession = true } = options;
  const ttlRef = useRef<number>(ttl);
  const getCacheKeyRef = useRef(getCacheKey);
  const persistToSessionRef = useRef<boolean>(persistToSession);

  ttlRef.current = ttl;
  getCacheKeyRef.current = getCacheKey;
  persistToSessionRef.current = persistToSession;

  const getCached = useCallback((params: any): T | null => {
    const key = getCacheKeyRef.current(params);
    const ttlMs = ttlRef.current;

    return readSharedCacheEntry<T>(key, ttlMs, persistToSessionRef.current);
  }, []);

  const setCached = useCallback((params: any, data: T): void => {
    const key = getCacheKeyRef.current(params);
    const ttlMs = ttlRef.current;

    writeSharedCacheEntry<T>(key, data, ttlMs, persistToSessionRef.current);
  }, []);

  const clearCache = useCallback((): void => {
    globalCache.clear();
  }, []);

  const removeCached = useCallback((params: any): void => {
    const key = getCacheKeyRef.current(params);
    globalCache.delete(key);
  }, []);

  const cleanExpired = useCallback((): void => {
    pruneGlobalCache(ttlRef.current);
  }, []);

  return {
    getCached,
    setCached,
    clearCache,
    removeCached,
    cleanExpired,
    cache: globalCache as Map<string, CacheEntry<T>>,
  };
}
