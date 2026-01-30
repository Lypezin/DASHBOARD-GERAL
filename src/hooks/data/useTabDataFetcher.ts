/**
 * Hook para gerenciar fetch de dados de tab com retry
 */

import { useState, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';
import { fetchTabData } from '@/utils/tabData/fetchTabData';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

export function useTabDataFetcher() {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWithRetry = async (
    tab: string,
    filterPayload: FilterPayload,
    onSuccess: (data: TabData, total?: number) => void,
    onError: (error: Error | RpcError) => void,
    shouldContinue: () => boolean
  ): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setLoading(true);

    try {
      const result = await fetchTabData({ tab, filterPayload });

      if (!shouldContinue()) {
        return;
      }

      if (result.error) {
        onError(result.error);
        setLoading(false);
        return;
      }

      onSuccess(result.data, result.total);
      setLoading(false);
    } catch (error) {
      if (!shouldContinue()) {
        return;
      }
      safeLog.error('Erro ao buscar dados:', error);

      const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
      if (errorMessage === 'RETRY_500') {
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_500);
        return;
      }

      if (errorMessage === 'RETRY_RATE_LIMIT') {
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_RATE_LIMIT);
        return;
      }

      onError(error instanceof Error ? error : new Error(String(error)));
      setLoading(false);
    }
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setLoading(false);
  };

  return {
    fetchWithRetry,
    cancel,
    loading,
  };
}
