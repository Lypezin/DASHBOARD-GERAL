
import { useState, useEffect, useRef, useMemo } from 'react';
import { UtrData, EntregadoresData, ValoresEntregador, CurrentUser } from '@/types';
import { useCache } from './useCache';
import { useTabDataFetcher } from './useTabDataFetcher';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTabFetchOrchestrator } from '@/hooks/dashboard/useTabFetchOrchestrator';

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

  const { fetchDataForTab } = useTabFetchOrchestrator({
    setData,
    currentTabRef,
    isRequestPendingRef,
    filterPayloadRef,
    getCached,
    setCached,
    fetchWithRetry
  });

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
  }, [activeTab, filterPayloadStr, isOrgLoading]);

  useEffect(() => setData(null), [activeTab]);
  return { data, loading };
}
