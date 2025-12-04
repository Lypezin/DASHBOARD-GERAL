/**
 * Hook para gerenciar cache de dados
 * Centraliza lógica de cache reutilizável
 * Implementa cache hierárquico: memória + sessionStorage
 */

import { useRef } from 'react';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';
const SESSION_STORAGE_PREFIX = 'dashboard_cache_v2_';
const MAX_SESSION_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface UseCacheOptions<T> {
  /** TTL do cache em milissegundos (padrão: CACHE.TAB_DATA_TTL) */
  ttl?: number;
  /** Função para gerar chaves de cache */
  getCacheKey: (params: any) => string;
}

/**
 * Obtém dados do sessionStorage se válidos
 */
function getFromSessionStorage<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    if (isCacheValid(entry, ttl)) {
      return entry.data;
    }

    // Remover se expirado
    sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
    return null;
  } catch (error) {
    if (IS_DEV) {
      console.warn('[useCache] Erro ao ler sessionStorage:', error);
    }
    return null;
  }
}

/**
 * Armazena dados no sessionStorage
 */
function setToSessionStorage<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return;

  try {
    const entry = createCacheEntry(data, ttl);
    const serialized = JSON.stringify(entry);

    // Verificar tamanho antes de salvar
    const currentSize = new Blob([serialized]).size;
    if (currentSize > MAX_SESSION_STORAGE_SIZE) {
      if (IS_DEV) {
        console.warn('[useCache] Dados muito grandes para sessionStorage, usando apenas memória');
      }
      return;
    }

    // Limpar entradas antigas se necessário
    cleanupSessionStorage();

    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${key}`, serialized);
  } catch (error) {
    if (IS_DEV) {
      console.warn('[useCache] Erro ao salvar no sessionStorage:', error);
    }
    // Se sessionStorage estiver cheio, tentar limpar e tentar novamente
    if (error instanceof DOMException && error.code === 22) {
      cleanupSessionStorage();
      try {
        const entry = createCacheEntry(data, ttl);
        sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch (retryError) {
        // Se ainda falhar, apenas usar memória
      }
    }
  }
}

/**
 * Limpa entradas expiradas do sessionStorage
 */
function cleanupSessionStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
        try {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (!isCacheValid(entry, CACHE.TAB_DATA_TTL)) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    if (IS_DEV) {
      console.warn('[useCache] Erro ao limpar sessionStorage:', error);
    }
  }
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

