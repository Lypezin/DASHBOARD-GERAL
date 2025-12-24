import { useRef } from 'react';
import { DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

// Cache global em memória (sobrevive a desmontagem de componentes)
const globalDashboardCache = {
    key: '',
    data: null as DashboardResumoData | null,
    timestamp: 0
};

export function useDashboardCache() {
    // Refs for flow control (still needed per instance)
    const previousPayloadRef = useRef<string>('');
    const isFirstExecutionRef = useRef<boolean>(true);
    const pendingPayloadKeyRef = useRef<string>('');

    // Initialize previousPayloadRef with global cache key if available to prevent initial re-fetch if payload matches
    if (isFirstExecutionRef.current && globalDashboardCache.key && globalDashboardCache.data) {
        // If we have global cache, we can potentialy use it. 
        // Logic in useDashboardDataEffect calls checkCache(payloadKey)
    }

    const checkCache = (payloadKey: string) => {
        if (globalDashboardCache.key === payloadKey && globalDashboardCache.data) {
            if (IS_DEV) safeLog.info('[useDashboardCache] Usando dados do cache global');
            return globalDashboardCache.data;
        }
        return null;
    };

    const updateCache = (payloadKey: string, data: DashboardResumoData) => {
        globalDashboardCache.data = data;
        globalDashboardCache.key = payloadKey;
        globalDashboardCache.timestamp = Date.now();
    };

    const clearCache = () => {
        if (IS_DEV) safeLog.info('[useDashboardCache] Limpando cache global');
        globalDashboardCache.key = '';
        globalDashboardCache.data = null;
        globalDashboardCache.timestamp = 0;
    };

    return {
        checkCache,
        updateCache,
        clearCache,
        previousPayloadRef,
        isFirstExecutionRef,
        pendingPayloadKeyRef
    };
}
