import { FilterOption } from '@/types';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_DURATION = 1000 * 60 * 30;
const MAX_DIMENSION_CACHE_ENTRIES = 24;
export const dimensionMemoryCache = new Map<string, DimensionCacheEntry>();
const dimensionRequests = new Map<string, Promise<DimensionCacheEntry>>();

export interface DimensionCacheEntry {
    timestamp: number;
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
}

export function isValidCacheEntry(entry?: DimensionCacheEntry | null): entry is DimensionCacheEntry {
    const now = Date.now();
    return !!entry
        && Number.isFinite(entry.timestamp)
        && entry.timestamp <= now
        && now - entry.timestamp < CACHE_DURATION;
}

function isValidCacheShape(value: unknown): value is DimensionCacheEntry {
    if (!value || typeof value !== 'object') return false;
    const entry = value as Partial<DimensionCacheEntry>;
    const isOptionList = (options: unknown) => Array.isArray(options)
        && options.every((option) => option
            && typeof option === 'object'
            && typeof (option as { value?: unknown }).value === 'string'
            && typeof (option as { label?: unknown }).label === 'string');

    return typeof entry.timestamp === 'number'
        && Number.isFinite(entry.timestamp)
        && entry.timestamp >= 0
        && entry.timestamp <= Date.now()
        && isOptionList(entry.subPracas)
        && isOptionList(entry.origens)
        && isOptionList(entry.turnos);
}

function touchDimensionCache(key: string, entry: DimensionCacheEntry) {
    dimensionMemoryCache.delete(key);
    dimensionMemoryCache.set(key, entry);
}

export function fetchDimensionOptionsWithDedupe(
    key: string,
    fetcher: () => Promise<DimensionCacheEntry>
) {
    const existing = dimensionRequests.get(key);
    if (existing) return existing;

    const request = fetcher().finally(() => {
        if (dimensionRequests.get(key) === request) dimensionRequests.delete(key);
    });
    dimensionRequests.set(key, request);
    return request;
}

export function getStorageKey(key: string) {
    return `dashboard_dimension_options_v2_${key}`;
}

function cleanupDimensionCache(removeExpired = true) {
    const canUseSessionStorage = typeof sessionStorage !== 'undefined';

    for (const [key, entry] of dimensionMemoryCache.entries()) {
        if (removeExpired && !isValidCacheEntry(entry)) {
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

export function readCachedOptions(key: string, allowStale = false): DimensionCacheEntry | null {
    cleanupDimensionCache(!allowStale);

    const memoryEntry = dimensionMemoryCache.get(key);
    if (memoryEntry && isValidCacheShape(memoryEntry) && (allowStale || isValidCacheEntry(memoryEntry))) {
        touchDimensionCache(key, memoryEntry);
        return memoryEntry;
    }
    if (memoryEntry) dimensionMemoryCache.delete(key);

    if (typeof sessionStorage === 'undefined') return null;

    const entry = readJsonStorage<DimensionCacheEntry | null>(sessionStorage, getStorageKey(key), null);
    if (isValidCacheShape(entry) && (allowStale || isValidCacheEntry(entry))) {
        touchDimensionCache(key, entry);
        cleanupDimensionCache(!allowStale);
        return entry;
    }

    if (entry) removeJsonStorage(sessionStorage, getStorageKey(key));

    return null;
}

export function writeCachedOptions(key: string, entry: DimensionCacheEntry) {
    cleanupDimensionCache();
    touchDimensionCache(key, entry);
    cleanupDimensionCache();

    if (typeof sessionStorage === 'undefined') return;

    writeJsonStorage(sessionStorage, getStorageKey(key), entry);
}
