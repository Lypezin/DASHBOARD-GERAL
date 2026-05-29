import { FilterOption } from '@/types';

const CACHE_DURATION = 1000 * 60 * 30;
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

export function readCachedOptions(key: string): DimensionCacheEntry | null {
    const memoryEntry = dimensionMemoryCache.get(key);
    if (isValidCacheEntry(memoryEntry)) return memoryEntry;

    try {
        const raw = sessionStorage.getItem(getStorageKey(key));
        if (!raw) return null;

        const entry = JSON.parse(raw) as DimensionCacheEntry;
        if (isValidCacheEntry(entry)) {
            dimensionMemoryCache.set(key, entry);
            return entry;
        }
    } catch {
        sessionStorage.removeItem(getStorageKey(key));
    }

    return null;
}

export function writeCachedOptions(key: string, entry: DimensionCacheEntry) {
    dimensionMemoryCache.set(key, entry);

    try {
        sessionStorage.setItem(getStorageKey(key), JSON.stringify(entry));
    } catch {
        // Cache local e opcional.
    }
}
