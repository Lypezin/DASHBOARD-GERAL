/**
 * Hook para gerenciar dados específicos de cada aba do dashboard
 * Refatorado para usar hooks especializados (useCache, useTabDataFetcher)
 */

import { useState, useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';
import { useCache } from './useCache';
import { useTabDataFetcher } from './useTabDataFetcher';
import { CACHE, DELAYS, RATE_LIMIT } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

// Sistema global de fila para evitar requisições simultâneas
const requestQueue = new Map<string, { timestamp: number; count: number }>();

/**
 * Hook para gerenciar dados específicos de cada aba do dashboard
 */
export function useTabData(
  activeTab: string,
  filterPayload: object,
  currentUser?: { is_admin: boolean; assigned_pracas: string[]; role?: 'admin' | 'marketing' | 'user' } | null
) {
  const [data, setData] = useState<TabData>(null);
  const currentTabRef = useRef<string>(activeTab);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFilterPayloadRef = useRef<string>('');
  const isRequestPendingRef = useRef<boolean>(false);

  // Hook de cache
  const { getCached, setCached } = useCache<TabData>({
    ttl: CACHE.TAB_DATA_TTL,
    getCacheKey: (params) => `${params.tab}-${JSON.stringify(params.filterPayload)}`,
  });

  // Hook de fetch com retry
  const { fetchWithRetry, cancel, loading } = useTabDataFetcher();

  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  // Usar useRef para armazenar o filterPayload e evitar recriações
  const filterPayloadRef = useRef<string>('');
  
  useEffect(() => {
    // Atualizar ref da tab imediatamente
    const previousTab = currentTabRef.current;
    currentTabRef.current = activeTab;
    
    // Verificar se o filterPayload realmente mudou usando string comparison
    const currentFilterPayloadStr = JSON.stringify(filterPayload);
    const filterPayloadChanged = filterPayloadRef.current !== currentFilterPayloadStr;
    const tabChanged = previousTab !== activeTab;
    
    // Se nada mudou, não fazer nada (evitar loop infinito)
    if (!tabChanged && !filterPayloadChanged) {
      return; // Removido log para evitar spam
    }

    // Atualizar referências
    filterPayloadRef.current = currentFilterPayloadStr;
    lastFilterPayloadRef.current = currentFilterPayloadStr;

    // Limpar timeout anterior APENAS se algo realmente mudou
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Cancelar requisição anterior apenas se a tab mudou
    if (tabChanged) {
      cancel();
    }

    const fetchDataForTab = async (tab: string) => {
      // Verificar se a tab ainda é a mesma
      if (currentTabRef.current !== tab) {
        isRequestPendingRef.current = false;
        return;
      }

      // Verificar se já há uma requisição pendente
      if (isRequestPendingRef.current) {
        return;
      }

      // Verificar rate limiting local
      const queueKey = `${tab}-${filterPayloadRef.current}`;
      const queueEntry = requestQueue.get(queueKey);
      const now = Date.now();

      if (queueEntry && (now - queueEntry.timestamp) < RATE_LIMIT.MIN_REQUEST_INTERVAL) {
        return;
      }

      // Registrar requisição na fila
      requestQueue.set(queueKey, { timestamp: now, count: (queueEntry?.count || 0) + 1 });

      // Limpar entradas antigas da fila
      let cleanedCount = 0;
      for (const [key, entry] of requestQueue.entries()) {
        if (cleanedCount >= RATE_LIMIT.MAX_CLEANUP_ENTRIES) break;
        if (now - entry.timestamp > RATE_LIMIT.QUEUE_CLEANUP_INTERVAL) {
          requestQueue.delete(key);
          cleanedCount++;
        }
      }

      // Verificar cache usando o payload atual
      const currentPayload = JSON.parse(filterPayloadRef.current);
      const cached = getCached({ tab, filterPayload: currentPayload });
      if (cached !== null) {
        if (currentTabRef.current !== tab) {
          isRequestPendingRef.current = false;
          return;
        }
        const cachedData = tab === 'valores'
          ? (Array.isArray(cached) ? cached : [])
          : cached;
        setData(cachedData);
        isRequestPendingRef.current = false;
        return;
      }

      // Marcar como pendente
      isRequestPendingRef.current = true;

      // Buscar dados com retry automático
      await fetchWithRetry(
        tab,
        currentPayload,
        (fetchedData) => {
          if (currentTabRef.current !== tab) {
            return;
          }

          // Processar dados para valores
          const processedData = tab === 'valores'
            ? (Array.isArray(fetchedData) ? fetchedData : [])
            : fetchedData;

          setData(processedData);
          setCached({ tab, filterPayload: currentPayload }, processedData);
          isRequestPendingRef.current = false;
        },
        (error) => {
          if (currentTabRef.current !== tab) {
            return;
          }

          // Tratar erro baseado no tipo de tab
          if (IS_DEV) {
            safeLog.error(`❌ Erro ao carregar dados para tab ${tab}:`, error);
          }

          if (tab === 'entregadores' || tab === 'prioridade') {
            if (IS_DEV) safeLog.info(`[useTabData] Definindo dados vazios para ${tab} após erro`);
            setData({ entregadores: [], total: 0 });
          } else if (tab === 'valores') {
            if (IS_DEV) safeLog.info(`[useTabData] Definindo array vazio para ${tab} após erro`);
            setData([]);
          } else {
            if (IS_DEV) safeLog.info(`[useTabData] Definindo null para ${tab} após erro`);
            setData(null);
          }

          isRequestPendingRef.current = false;
        },
        () => currentTabRef.current === tab
      );
    };

    // Debounce para evitar múltiplas chamadas
    // IMPORTANTE: Capturar o valor atual da tab e payload para usar no timeout
    const tabToFetch = activeTab;
    const payloadToFetch = currentFilterPayloadStr;
    
    debounceTimeoutRef.current = setTimeout(() => {
      // Verificar se a tab e payload ainda são os mesmos
      if (currentTabRef.current === tabToFetch && filterPayloadRef.current === payloadToFetch) {
        fetchDataForTab(tabToFetch);
      }
    }, DELAYS.DEBOUNCE);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      cancel();
      isRequestPendingRef.current = false;
    };
    // IMPORTANTE: Usar apenas activeTab e filterPayload como dependências
    // As funções (getCached, setCached, fetchWithRetry, cancel) são estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, JSON.stringify(filterPayload)]);

  // Resetar dados quando a tab mudar para evitar stale data
  useEffect(() => {
    setData(null);
  }, [activeTab]);

  return {
    data,
    loading,
  };
}
