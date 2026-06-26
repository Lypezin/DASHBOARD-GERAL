import { FilterOption } from '@/types';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_DURATION = 1000 * 60 * 30;
const MAX_DIMENSION_CACHE_ENTRIES = 24;
export const dimensionMemoryCache = new Map<string, DimensionCacheEntry>();

export interface DimensionCacheEntry {
    timestamp: number;
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
}

export function isValidCacheEntry(entry?: DimensionCacheEntry | null): entry is DimensionCacheEntry {
    return !!entry && Date.now() - entry.timestamp < CACHE_DURATION;
}

export function getStorageKey(key: string) {
    return `dashboard_dimension_options_v1_${key}`;
}

function cleanupDimensionCache() {
    const canUseSessionStorage = typeof sessionStorage !== 'undefined';

    for (const [key, entry] of dimensionMemoryCache.entries()) {
        if (!isValidCacheEntry(entry)) {
            dimensionMemoryCache.delete(key);
            if (!canUseSessionStorage) continue;

            removeJsonStorage(sessionStorage, getStorageKey(key));
        }
    }

    while (dimensionMemoryCache.size > MAX_DIMENSION_CACHE_ENTRIES) {
        const oldestKey = dimensionMemoryCache.keys().next().value;
        if (!oldestKey) break;
        dimensionMemoryCache.delete(oldestKey);
        if (!canUseSessionStorage) continue;

        removeJsonStorage(sessionStorage, getStorageKey(oldestKey));
    }
}

export function readCachedOptions(key: string): DimensionCacheEntry | null {
    cleanupDimensionCache();

    const memoryEntry = dimensionMemoryCache.get(key);
    if (isValidCacheEntry(memoryEntry)) return memoryEntry;

    if (typeof sessionStorage === 'undefined') return null;

    const entry = readJsonStorage<DimensionCacheEntry | null>(sessionStorage, getStorageKey(key), null);
    if (isValidCacheEntry(entry)) {
        dimensionMemoryCache.set(key, entry);
        return entry;
    }

    return null;
}

export function writeCachedOptions(key: string, entry: DimensionCacheEntry) {
    cleanupDimensionCache();
    dimensionMemoryCache.set(key, entry);

    if (typeof sessionStorage === 'undefined') return;

    writeJsonStorage(sessionStorage, getStorageKey(key), entry);
}
