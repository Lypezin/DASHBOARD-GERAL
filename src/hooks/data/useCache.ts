/**
 * Hook para gerenciar cache de dados.
 * Centraliza memoria + sessionStorage com uma camada global compartilhada
 * entre montagens de guias diferentes.
 */

import { useCallback, useRef } from 'react';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';
import { getFromSessionStorage, setToSessionStorage } from '@/hooks/cache/sessionStorage';

interface UseCacheOptions<T> {
  ttl?: number;
  getCacheKey: (params: any) => string;
}

const globalCache = new Map<string, CacheEntry<unknown>>();
const MAX_GLOBAL_CACHE_ENTRIES = 24;

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

export function readSharedCacheEntry<T>(key: string, ttl: number = CACHE.TAB_DATA_TTL): T | null {
  pruneGlobalCache(ttl);

  const cached = globalCache.get(key);
  if (cached && isCacheValid(cached, ttl)) {
    touchGlobalCacheEntry(key, cached);
    return cached.data as T;
  }

  const sessionData = getFromSessionStorage<T>(key, ttl);
  if (sessionData !== null) {
    touchGlobalCacheEntry(key, createCacheEntry(sessionData, ttl) as CacheEntry<unknown>);
    return sessionData;
  }

  return null;
}

export function writeSharedCacheEntry<T>(key: string, data: T, ttl: number = CACHE.TAB_DATA_TTL): void {
  touchGlobalCacheEntry(key, createCacheEntry(data, ttl) as CacheEntry<unknown>);
  pruneGlobalCache(ttl);
  setToSessionStorage(key, data, ttl);
}

export function useCache<T>(options: UseCacheOptions<T>) {
  const { ttl = CACHE.TAB_DATA_TTL, getCacheKey } = options;
  const ttlRef = useRef<number>(ttl);
  const getCacheKeyRef = useRef(getCacheKey);

  ttlRef.current = ttl;
  getCacheKeyRef.current = getCacheKey;

  const getCached = useCallback((params: any): T | null => {
    const key = getCacheKeyRef.current(params);
    const ttlMs = ttlRef.current;

    return readSharedCacheEntry<T>(key, ttlMs);
  }, []);

  const setCached = useCallback((params: any, data: T): void => {
    const key = getCacheKeyRef.current(params);
    const ttlMs = ttlRef.current;

    writeSharedCacheEntry<T>(key, data, ttlMs);
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
