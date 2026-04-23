import { useCallback, useRef } from 'react';
import { CACHE } from '@/constants/config';
import { DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';
const MAX_CACHE_ENTRIES = 8;

interface DashboardCacheEntry {
    data: DashboardResumoData;
    timestamp: number;
}

const globalDashboardCache = new Map<string, DashboardCacheEntry>();

function pruneCache() {
    const now = Date.now();

    for (const [key, entry] of globalDashboardCache.entries()) {
        if (now - entry.timestamp > CACHE.TAB_DATA_TTL) {
            globalDashboardCache.delete(key);
        }
    }

    while (globalDashboardCache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = globalDashboardCache.keys().next().value;
        if (!oldestKey) break;
        globalDashboardCache.delete(oldestKey);
    }
}

function touchCacheEntry(key: string, entry: DashboardCacheEntry) {
    globalDashboardCache.delete(key);
    globalDashboardCache.set(key, entry);
}

export function getInitialCacheData(payloadKey?: string): DashboardResumoData | null {
    if (!payloadKey) return null;

    pruneCache();

    const cached = globalDashboardCache.get(payloadKey);
    if (!cached) return null;

    touchCacheEntry(payloadKey, cached);
    return cached.data;
}

export function getCacheKey(): string {
    pruneCache();
    const latestKey = Array.from(globalDashboardCache.keys()).pop();
    return latestKey || '';
}

export function useDashboardCache() {
    pruneCache();

    const previousPayloadRef = useRef<string>(getCacheKey());
    const isFirstExecutionRef = useRef<boolean>(globalDashboardCache.size === 0);
    const pendingPayloadKeyRef = useRef<string>('');

    const checkCache = useCallback((payloadKey: string) => {
        pruneCache();

        const cached = globalDashboardCache.get(payloadKey);
        if (!cached) return null;

        if (IS_DEV) safeLog.info('[useDashboardCache] Usando dados do cache global');
        touchCacheEntry(payloadKey, cached);
        return cached.data;
    }, []);

    const updateCache = useCallback((payloadKey: string, data: DashboardResumoData) => {
        pruneCache();
        touchCacheEntry(payloadKey, {
            data,
            timestamp: Date.now()
        });
    }, []);

    const clearCache = useCallback(() => {
        if (IS_DEV) safeLog.info('[useDashboardCache] Limpando cache global');
        globalDashboardCache.clear();
    }, []);

    const getCacheData = useCallback(() => {
        pruneCache();
        const latestEntry = Array.from(globalDashboardCache.values()).pop();
        return latestEntry?.data ?? null;
    }, []);

    return {
        checkCache,
        updateCache,
        clearCache,
        getCacheData,
        previousPayloadRef,
        isFirstExecutionRef,
        pendingPayloadKeyRef
    };
}
