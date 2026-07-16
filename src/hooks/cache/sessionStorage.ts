import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';
import { CACHE } from '@/constants/config';
import { IS_DEV } from '@/constants/environment';
import { safeLog } from '@/lib/errorHandler';

const SESSION_STORAGE_PREFIX = 'dashboard_cache_v2_';
const MAX_PERSISTED_ENTRY_SIZE = 512 * 1024;
const MAX_PERSISTED_ENTRIES = 12;

/** Obtém dados do sessionStorage se válidos */
export function getFromSessionStorage<T>(key: string, ttl: number): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
        if (!stored) return null;

        const entry: CacheEntry<T> = JSON.parse(stored);
        if (isCacheValid(entry, ttl)) return entry.data;

        // Remover se expirado
        sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
        return null;
    } catch (error) {
        if (IS_DEV) {
            safeLog.warn('[useCache] Erro ao ler sessionStorage:', error);
        }
        return null;
    }
}

/** Limpa entradas expiradas do sessionStorage */
export function cleanupSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
        const keysToRemove: string[] = [];
        const validEntries: Array<{ key: string; timestamp: number }> = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
                try {
                    const stored = sessionStorage.getItem(key);
                    if (stored) {
                        const entry = JSON.parse(stored);
                        if (!isCacheValid(entry, CACHE.TAB_DATA_TTL)) {
                            keysToRemove.push(key);
                        } else {
                            validEntries.push({ key, timestamp: Number(entry.timestamp) || 0 });
                        }
                    }
                } catch {
                    keysToRemove.push(key);
                }
            }
        }

        validEntries
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(MAX_PERSISTED_ENTRIES)
            .forEach(({ key }) => keysToRemove.push(key));

        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
        if (IS_DEV) {
            safeLog.warn('[useCache] Erro ao limpar sessionStorage:', error);
        }
    }
}

/** Armazena dados no sessionStorage */
export function setToSessionStorage<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return;

    try {
        const entry = createCacheEntry(data, ttl);
        const serialized = JSON.stringify(entry);

        // Verificar tamanho antes de salvar
        // JSON grande deve permanecer apenas no cache em memÃ³ria. Persisti-lo
        // bloquearia a thread principal em filtros com milhares de linhas.
        const estimatedUtf16Size = serialized.length * 2;
        if (estimatedUtf16Size > MAX_PERSISTED_ENTRY_SIZE) {
            if (IS_DEV) {
                safeLog.warn('[useCache] Dados muito grandes para sessionStorage, usando apenas memória');
            }
            return;
        }

        // Limpar entradas antigas se necessário
        cleanupSessionStorage();

        sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${key}`, serialized);
    } catch (error) {
        if (IS_DEV) {
            safeLog.warn('[useCache] Erro ao salvar no sessionStorage:', error);
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
