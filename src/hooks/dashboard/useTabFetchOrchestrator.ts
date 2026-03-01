import { useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';
import { checkRateLimit, addToQueue, getPendingRequest, setPendingRequest } from '@/utils/dashboard/requestQueue';
import { useCache } from '@/hooks/data/useCache';
import { useTabDataFetcher } from '@/hooks/data/useTabDataFetcher';

const IS_DEV = process.env.NODE_ENV === 'development';
type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

interface UseTabFetchOrchestratorProps {
    setData: React.Dispatch<React.SetStateAction<TabData>>; currentTabRef: React.MutableRefObject<string>;
    isRequestPendingRef: React.MutableRefObject<boolean>; filterPayloadRef: React.MutableRefObject<string>;
    getCached: (params: { tab: string; filterPayload: any }) => TabData | null;
    setCached: (params: { tab: string; filterPayload: any }, data: TabData) => void;
    fetchWithRetry: (tab: string, payload: any, onSuccess: (data: any, total?: number) => void, onError: (error: any) => void, shouldContinue: () => boolean) => void;
}

export function useTabFetchOrchestrator({
    setData, currentTabRef, isRequestPendingRef, filterPayloadRef, getCached, setCached, fetchWithRetry
}: UseTabFetchOrchestratorProps) {
    const fetchDataForTab = async (tab: string) => {
        if (currentTabRef.current !== tab || isRequestPendingRef.current) return;

        const currentPayload = JSON.parse(filterPayloadRef.current);
        const queueKey = `${tab}-${filterPayloadRef.current}`;

        if (!checkRateLimit(queueKey)) return;

        const pendingPromise = getPendingRequest(queueKey);
        if (pendingPromise) {
            pendingPromise.then((fetchedData: any) => {
                if (currentTabRef.current !== tab) return;
                const processedData = tab === 'valores' ? (Array.isArray(fetchedData) ? fetchedData as ValoresEntregador[] : []) : (fetchedData as TabData);
                setData(processedData);
                setCached({ tab, filterPayload: currentPayload }, processedData);
                isRequestPendingRef.current = false;
            }).catch(() => {
                if (currentTabRef.current === tab) { handleFetchError(tab); isRequestPendingRef.current = false; }
            });
            return;
        }

        addToQueue(queueKey);

        const cached = getCached({ tab, filterPayload: currentPayload });
        if (cached !== null) {
            if (currentTabRef.current === tab) {
                setData(tab === 'valores' ? (Array.isArray(cached) ? cached as ValoresEntregador[] : []) : cached as TabData);
                isRequestPendingRef.current = false;
            }
            return;
        }

        isRequestPendingRef.current = true;
        const fetchPromise = new Promise((resolve, reject) => {
            fetchWithRetry(tab, currentPayload,
                (fetchedData, total) => {
                    if (currentTabRef.current !== tab) { resolve(null); return; }

                    let processedData: TabData;
                    if (tab === 'valores') {
                        processedData = Array.isArray(fetchedData) ? fetchedData as ValoresEntregador[] : [];
                        if (total !== undefined) (processedData as any).total = total;
                    } else {
                        processedData = fetchedData as TabData;
                    }

                    setData(processedData);
                    setCached({ tab, filterPayload: currentPayload }, processedData);
                    isRequestPendingRef.current = false;
                    resolve(processedData);
                },
                (error) => {
                    if (currentTabRef.current === tab) {
                        if (IS_DEV) safeLog.error(`❌ Erro dados tab ${tab}:`, error);
                        handleFetchError(tab); isRequestPendingRef.current = false;
                    }
                    reject(error);
                },
                () => currentTabRef.current === tab
            );
        });
        setPendingRequest(queueKey, fetchPromise);
    };

    const handleFetchError = (tab: string) => {
        if (tab === 'entregadores' || tab === 'prioridade') setData({ entregadores: [], total: 0 });
        else if (tab === 'valores') setData([]);
        else setData(null);
    };

    return { fetchDataForTab };
}
