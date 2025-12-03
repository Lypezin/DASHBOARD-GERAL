import { useRef } from 'react';
import { DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardCache() {
    const cacheKeyRef = useRef<string>('');
    const cachedDataRef = useRef<DashboardResumoData | null>(null);
    const previousPayloadRef = useRef<string>('');
    const isFirstExecutionRef = useRef<boolean>(true);
    const pendingPayloadKeyRef = useRef<string>('');

    const checkCache = (payloadKey: string) => {
        if (cacheKeyRef.current === payloadKey && cachedDataRef.current) {
            if (IS_DEV) safeLog.info('[useDashboardCache] Usando dados do cache');
            return cachedDataRef.current;
        }
        return null;
    };

    const updateCache = (payloadKey: string, data: DashboardResumoData) => {
        cachedDataRef.current = data;
        cacheKeyRef.current = payloadKey;
    };

    const clearCache = () => {
        if (IS_DEV) safeLog.info('[useDashboardCache] Limpando cache');
        cacheKeyRef.current = '';
        cachedDataRef.current = null;
    };

    return {
        checkCache,
        updateCache,
        clearCache,
        cacheKeyRef,
        cachedDataRef,
        previousPayloadRef,
        isFirstExecutionRef,
        pendingPayloadKeyRef
    };
}
