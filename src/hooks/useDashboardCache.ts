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
    // Initialize previousPayloadRef with global cache key to prevent re-fetch when component remounts
    // This fixes the issue where returning to the tab caused a refresh
    const previousPayloadRef = useRef<string>(globalDashboardCache.key || '');
    const isFirstExecutionRef = useRef<boolean>(!globalDashboardCache.data);
    const pendingPayloadKeyRef = useRef<string>('');

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
