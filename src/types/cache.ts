/**
 * Tipos relacionados a cache de dados
 */

/**
 * Entrada de cache com timestamp e TTL
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live em milissegundos
}

/**
 * Verifica se uma entrada de cache ainda é válida
 */
export function isCacheValid<T>(entry: CacheEntry<T> | undefined, defaultTtl: number = 300000): boolean {
  if (!entry) return false;
  
  const ttl = entry.ttl ?? defaultTtl;
  const age = Date.now() - entry.timestamp;
  return age < ttl;
}

/**
 * Cria uma entrada de cache
 */
export function createCacheEntry<T>(data: T, ttl?: number): CacheEntry<T> {
  return {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

