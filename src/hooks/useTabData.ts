import { useState, useEffect, useRef, useMemo } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData, EntregadoresData, ValoresEntregador, CurrentUser } from '@/types';
import { useCache } from './useCache';
import { useTabDataFetcher } from './useTabDataFetcher';
import { CACHE, DELAYS } from '@/constants/config';
import { checkRateLimit, addToQueue, getPendingRequest, setPendingRequest } from '@/utils/dashboard/requestQueue';
import { useOrganization } from '@/contexts/OrganizationContext';

const IS_DEV = process.env.NODE_ENV === 'development';
type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

export function useTabData(activeTab: string, filterPayload: object, currentUser?: CurrentUser | null) {
  const [data, setData] = useState<TabData>(null);
  const currentTabRef = useRef<string>(activeTab);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterPayloadRef = useRef<string>('');
  const previousTabRef = useRef<string>('');
  const isRequestPendingRef = useRef<boolean>(false);

  const { isLoading: isOrgLoading } = useOrganization();

  const { getCached, setCached } = useCache<TabData>({
    ttl: CACHE.TAB_DATA_TTL,
    getCacheKey: (params) => `${params.tab}-${JSON.stringify(params.filterPayload)}`,
  });

  const { fetchWithRetry, cancel, loading } = useTabDataFetcher();
  const filterPayloadStr = useMemo(() => JSON.stringify(filterPayload), [filterPayload]);

  useEffect(() => {
    if (isOrgLoading) {
      return;
    }

    if (['evolucao', 'dashboard', 'analise', 'comparacao', 'marketing'].includes(activeTab)) {
      setData(null); return;
    }

    const previousTab = previousTabRef.current || '';
    const previousPayload = filterPayloadRef.current;
    const filterPayloadChanged = previousPayload !== filterPayloadStr;
    const tabChanged = previousTab !== activeTab;

    previousTabRef.current = activeTab;
    currentTabRef.current = activeTab;

    if (!tabChanged && !filterPayloadChanged) return;

    filterPayloadRef.current = filterPayloadStr;
    if (debounceTimeoutRef.current) { clearTimeout(debounceTimeoutRef.current); debounceTimeoutRef.current = null; }
    if (tabChanged) cancel();

    const fetchDataForTab = async (tab: string) => {
      if (currentTabRef.current !== tab || isRequestPendingRef.current) return;

      const currentPayload = JSON.parse(filterPayloadRef.current);
      const queueKey = `${tab}-${filterPayloadRef.current}`;

      if (!checkRateLimit(queueKey)) return;

      const pendingPromise = getPendingRequest(queueKey);
      if (pendingPromise) {
        pendingPromise.then((fetchedData) => {
          if (currentTabRef.current !== tab) return;
          const processedData = tab === 'valores'
            ? (Array.isArray(fetchedData) ? fetchedData as ValoresEntregador[] : [])
            : (fetchedData as TabData);
          setData(processedData);
          setCached({ tab, filterPayload: currentPayload }, processedData);
          isRequestPendingRef.current = false;
        }).catch(() => {
          if (currentTabRef.current === tab) {
            handleFetchError(tab);
            isRequestPendingRef.current = false;
          }
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
          (fetchedData) => {
            if (currentTabRef.current !== tab) { resolve(null); return; }
            const processedData = tab === 'valores' ? (Array.isArray(fetchedData) ? fetchedData as ValoresEntregador[] : []) : (fetchedData as TabData);
            setData(processedData);
            setCached({ tab, filterPayload: currentPayload }, processedData);
            isRequestPendingRef.current = false;
            resolve(processedData);
          },
          (error) => {
            if (currentTabRef.current === tab) {
              if (IS_DEV) safeLog.error(`❌ Erro dados tab ${tab}:`, error);
              handleFetchError(tab);
              isRequestPendingRef.current = false;
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

    debounceTimeoutRef.current = setTimeout(() => {
      if (currentTabRef.current === activeTab && filterPayloadRef.current === filterPayloadStr) {
        fetchDataForTab(activeTab);
      }
    }, DELAYS.DEBOUNCE);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      cancel();
      isRequestPendingRef.current = false;
    };
  }, [activeTab, filterPayloadStr]);

  useEffect(() => setData(null), [activeTab]);
  return { data, loading };
}
