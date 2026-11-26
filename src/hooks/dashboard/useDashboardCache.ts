import { useCallback, useRef } from 'react';
import { CACHE } from '@/constants/config';
import { DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { IS_DEV } from '@/constants/environment';
import {
    getTimedCacheValue,
    pruneTimedCacheEntries,
    setTimedCacheValue,
    type TimedCacheEntry,
} from '@/utils/cache/timedLruCache';

const MAX_CACHE_ENTRIES = 8;
const dashboardCachePolicy = { ttlMs: CACHE.TAB_DATA_TTL, maxEntries: MAX_CACHE_ENTRIES } as const;
const globalDashboardCache = new Map<string, TimedCacheEntry<DashboardResumoData>>();

export function getInitialCacheData(payloadKey?: string): DashboardResumoData | null {
    if (!payloadKey) return null;

    return getTimedCacheValue(globalDashboardCache, payloadKey, dashboardCachePolicy);
}

function getLatestCachedKey(): string {
    pruneTimedCacheEntries(globalDashboardCache, CACHE.TAB_DATA_TTL);
    let latestKey = '';
    for (const key of globalDashboardCache.keys()) {
        latestKey = key;
    }
    return latestKey;
}

export function useDashboardCache() {
    const previousPayloadRef = useRef<string>('');
    const initializedRef = useRef(false);
    const isFirstExecutionRef = useRef<boolean>(false);
    if (!initializedRef.current) {
        initializedRef.current = true;
        previousPayloadRef.current = getLatestCachedKey();
        isFirstExecutionRef.current = globalDashboardCache.size === 0;
    }
    const pendingPayloadKeyRef = useRef<string>('');

    const checkCache = useCallback((payloadKey: string) => {
        const cached = getTimedCacheValue(globalDashboardCache, payloadKey, dashboardCachePolicy);
        if (!cached) return null;

        if (IS_DEV) safeLog.info('[useDashboardCache] Usando dados do cache global');
        return cached;
    }, []);

    const updateCache = useCallback((payloadKey: string, data: DashboardResumoData) => {
        setTimedCacheValue(globalDashboardCache, payloadKey, data, dashboardCachePolicy);
    }, []);

    const clearCache = useCallback(() => {
        if (IS_DEV) safeLog.info('[useDashboardCache] Limpando cache global');
        globalDashboardCache.clear();
    }, []);

    return {
        checkCache,
        updateCache,
        clearCache,
        previousPayloadRef,
        isFirstExecutionRef,
        pendingPayloadKeyRef
    };
}
