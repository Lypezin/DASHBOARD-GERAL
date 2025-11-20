/**
 * Hook para gerenciar cache de dados
 * Centraliza lógica de cache reutilizável
 */

import { useRef } from 'react';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';

interface UseCacheOptions<T> {
  /** TTL do cache em milissegundos (padrão: CACHE.TAB_DATA_TTL) */
  ttl?: number;
  /** Função para gerar chave de cache */
  getCacheKey: (params: any) => string;
}

/**
 * Hook para gerenciar cache de dados
 */
export function useCache<T>(options: UseCacheOptions<T>) {
  const { ttl = CACHE.TAB_DATA_TTL, getCacheKey } = options;
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  /**
   * Obtém dados do cache se válidos
   */
  const getCached = (params: any): T | null => {
    const key = getCacheKey(params);
    const cached = cacheRef.current.get(key);
    
    if (cached && isCacheValid(cached, ttl)) {
      return cached.data;
    }
    
    return null;
  };

  /**
   * Armazena dados no cache
   */
  const setCached = (params: any, data: T): void => {
    const key = getCacheKey(params);
    cacheRef.current.set(key, createCacheEntry(data, ttl));
  };

  /**
   * Limpa o cache
   */
  const clearCache = (): void => {
    cacheRef.current.clear();
  };

  /**
   * Remove entrada específica do cache
   */
  const removeCached = (params: any): void => {
    const key = getCacheKey(params);
    cacheRef.current.delete(key);
  };

  /**
   * Limpa entradas expiradas do cache
   */
  const cleanExpired = (): void => {
    const now = Date.now();
    for (const [key, entry] of cacheRef.current.entries()) {
      if (!isCacheValid(entry, ttl)) {
        cacheRef.current.delete(key);
      }
    }
  };

  return {
    getCached,
    setCached,
    clearCache,
    removeCached,
    cleanExpired,
    cache: cacheRef.current,
  };
}

