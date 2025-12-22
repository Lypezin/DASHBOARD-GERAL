/**
 * Hook para gerenciar cache de dados
 * Centraliza lógica de cache reutilizável
 * Implementa cache hierárquico: memória + sessionStorage
 */

import { useRef } from 'react';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';
import { getFromSessionStorage, setToSessionStorage } from './cache/sessionStorage';

interface UseCacheOptions<T> {
  /** TTL do cache em milissegundos (padrão: CACHE.TAB_DATA_TTL) */
  ttl?: number;
  /** Função para gerar chaves de cache */
  getCacheKey: (params: any) => string;
}

/**
 * Hook para gerenciar cache de dados
 */
export function useCache<T>(options: UseCacheOptions<T>) {
  const { ttl = CACHE.TAB_DATA_TTL, getCacheKey } = options;
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  /**
   * Obtém dados do cache se válidos (memória primeiro, depois sessionStorage)
   */
  const getCached = (params: any): T | null => {
    const key = getCacheKey(params);

    // Tentar memória primeiro (mais rápido)
    const cached = cacheRef.current.get(key);
    if (cached && isCacheValid(cached, ttl)) {
      return cached.data;
    }

    // Tentar sessionStorage
    const sessionData = getFromSessionStorage<T>(key, ttl);
    if (sessionData !== null) {
      // Restaurar na memória para acesso rápido
      cacheRef.current.set(key, createCacheEntry(sessionData, ttl));
      return sessionData;
    }

    return null;
  };

  /**
   * Armazena dados no cache (memória + sessionStorage)
   */
  const setCached = (params: any, data: T): void => {
    const key = getCacheKey(params);

    // Salvar na memória
    cacheRef.current.set(key, createCacheEntry(data, ttl));

    // Salvar no sessionStorage (persistência entre recarregamentos)
    setToSessionStorage(key, data, ttl);
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
