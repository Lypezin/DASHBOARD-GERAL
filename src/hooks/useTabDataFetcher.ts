/**
 * Hook para buscar dados de uma tab específica
 * Separa lógica de fetch por tipo de tab
 */

import { useState, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

interface FetchOptions {
  tab: string;
  filterPayload: any;
  onRetry?: (attempt: number) => void;
}

/**
 * Busca dados de UTR
 */
async function fetchUtrData(options: FetchOptions): Promise<{ data: UtrData | null; error: any }> {
  const { tab, filterPayload } = options;
  
  const result = await safeRpc<UtrData>('calcular_utr', filterPayload as any, {
    timeout: RPC_TIMEOUTS.DEFAULT,
    validateParams: true
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);
    
    if (is500) {
      safeLog.warn('Erro 500 ao buscar UTR. Aguardando antes de tentar novamente...');
      throw new Error('RETRY_500');
    }
    
    if (isRateLimit) {
      safeLog.warn('Rate limit ao buscar UTR. Aguardando...');
      throw new Error('RETRY_RATE_LIMIT');
    }
    
    safeLog.error('Erro ao buscar UTR:', result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

/**
 * Busca dados de Entregadores
 */
async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: any }> {
  const { tab, filterPayload } = options;
  
  const listarEntregadoresPayload = {
    ...filterPayload,
    p_limite: 1000,
  };

  const result = await safeRpc<EntregadoresData>('listar_entregadores', listarEntregadoresPayload, {
    timeout: RPC_TIMEOUTS.FAST,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);
    
    if (is500) {
      safeLog.warn('Erro 500 ao buscar entregadores. Aguardando antes de tentar novamente...');
      throw new Error('RETRY_500');
    }
    
    if (isRateLimit) {
      safeLog.warn('Rate limit ao buscar entregadores. Aguardando...');
      throw new Error('RETRY_RATE_LIMIT');
    }
    
    safeLog.error('Erro ao buscar entregadores:', result.error);
    return { data: { entregadores: [], total: 0 }, error: result.error };
  }

  let processedData: EntregadoresData = { entregadores: [], total: 0 };
  
  if (result && result.data) {
    let entregadores: any[] = [];
    let total = 0;
    
    if (Array.isArray(result.data)) {
      entregadores = result.data;
      total = result.data.length;
    } else if (result.data && typeof result.data === 'object') {
      if ('entregadores' in result.data && Array.isArray(result.data.entregadores)) {
        entregadores = result.data.entregadores;
        total = result.data.total || result.data.entregadores.length;
      } else {
        entregadores = [result.data];
        total = 1;
      }
    }
    
    processedData = { entregadores, total };
  }

  return { data: processedData, error: null };
}

/**
 * Busca dados de Valores
 */
async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: any }> {
  const { tab, filterPayload } = options;
  
  const listarValoresPayload = {
    ...filterPayload,
    p_limite: 1000,
  };

  const result = await safeRpc<ValoresEntregador[]>('listar_valores_entregadores', listarValoresPayload, {
    timeout: RPC_TIMEOUTS.FAST,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);
    
    if (is500) {
      safeLog.warn('Erro 500 ao buscar valores. Aguardando antes de tentar novamente...');
      throw new Error('RETRY_500');
    }
    
    if (isRateLimit) {
      safeLog.warn('Rate limit ao buscar valores. Aguardando...');
      throw new Error('RETRY_RATE_LIMIT');
    }
    
    safeLog.error('Erro ao buscar valores:', result.error);
    return { data: [], error: result.error };
  }

  let processedData: ValoresEntregador[] = [];
  
  if (result && result.data !== null && result.data !== undefined) {
    if (Array.isArray(result.data)) {
      processedData = result.data;
    } else if (result.data && typeof result.data === 'object') {
      const dataObj = result.data as any;
      if ('valores' in dataObj && Array.isArray(dataObj.valores)) {
        processedData = dataObj.valores;
      } else {
        processedData = [result.data as ValoresEntregador];
      }
    }
  }

  return { data: processedData, error: null };
}

/**
 * Busca dados baseado no tipo de tab
 */
export async function fetchTabData(options: FetchOptions): Promise<{ data: TabData; error: any }> {
  const { tab } = options;
  
  try {
    switch (tab) {
      case 'utr':
        return await fetchUtrData(options);
      
      case 'entregadores':
        return await fetchEntregadoresData(options);
      
      case 'valores':
        return await fetchValoresData(options);

      case 'prioridade':
        return await fetchEntregadoresData(options);
      
      default:
        return { data: null, error: new Error(`Tab desconhecida: ${tab}`) };
    }
  } catch (error: any) {
    if (error.message === 'RETRY_500' || error.message === 'RETRY_RATE_LIMIT') {
      throw error; // Re-lançar para tratamento de retry
    }
    return { data: null, error };
  }
}

/**
 * Hook para gerenciar fetch de dados de tab com retry
 */
export function useTabDataFetcher() {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWithRetry = async (
    tab: string,
    filterPayload: any,
    onSuccess: (data: TabData) => void,
    onError: (error: any) => void,
    shouldContinue: () => boolean
  ): Promise<void> => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Limpar timeout de retry anterior
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

      onSuccess(result.data);
      setLoading(false);
    } catch (error: any) {
      if (!shouldContinue()) {
        return;
      }

      if (error.message === 'RETRY_500') {
        // Retry após delay para erro 500
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_500);
        return;
      }

      if (error.message === 'RETRY_RATE_LIMIT') {
        // Retry após delay maior para rate limit
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldContinue()) {
            fetchWithRetry(tab, filterPayload, onSuccess, onError, shouldContinue);
          }
        }, DELAYS.RETRY_RATE_LIMIT);
        return;
      }

      onError(error);
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

