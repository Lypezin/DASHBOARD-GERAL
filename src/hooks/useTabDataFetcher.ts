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

  // LOG FORÇADO PARA DEBUG - REMOVER DEPOIS
  console.log('[fetchUtrData] Chamando RPC calcular_utr com payload:', filterPayload);

  const result = await safeRpc<any>('calcular_utr', filterPayload as any, {
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

  // A função retorna um objeto JSONB diretamente
  // Verificar se precisa extrair de alguma estrutura
  let utrData: UtrData | null = null;
  
  if (result && result.data) {
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      // Se já for objeto, usar diretamente
      utrData = result.data as UtrData;
    } else {
      safeLog.warn('[fetchUtrData] Estrutura de dados inesperada:', result.data);
      utrData = null;
    }
  }

  console.log('[fetchUtrData] Dados processados:', { hasData: !!utrData, keys: utrData ? Object.keys(utrData) : [] });

  return { data: utrData, error: null };
}

/**
 * Busca dados de Entregadores
 */
async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: any }> {
  const { tab, filterPayload } = options;

  // Remover p_turno pois a função não suporta
  const { p_turno, ...restPayload } = filterPayload;
  const listarEntregadoresPayload = {
    ...restPayload,
  };

  // LOG FORÇADO PARA DEBUG - REMOVER DEPOIS
  console.log('[fetchEntregadoresData] Chamando RPC listar_entregadores com payload:', listarEntregadoresPayload);

  const result = await safeRpc<any>('listar_entregadores', listarEntregadoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    console.log('[fetchEntregadoresData] ERRO recebido:', result.error);
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

  // LOG FORÇADO PARA DEBUG - REMOVER DEPOIS
  console.log('[fetchEntregadoresData] Resposta recebida:', {
    hasData: !!result.data,
    dataType: typeof result.data,
    isArray: Array.isArray(result.data),
    dataKeys: result.data ? Object.keys(result.data) : 'no data',
    tab
  });

  if (result && result.data) {
    let entregadores: any[] = [];
    let total = 0;

    // A função retorna um objeto JSONB com a estrutura { entregadores: [...], total: N }
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      if ('entregadores' in result.data && Array.isArray(result.data.entregadores)) {
        entregadores = result.data.entregadores;
        total = result.data.total !== undefined ? result.data.total : result.data.entregadores.length;
      } else {
        // Se não tiver a estrutura esperada, tentar usar como array único
        safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', result.data);
        entregadores = [];
        total = 0;
      }
    } else if (Array.isArray(result.data)) {
      // Se já for array, usar diretamente
      entregadores = result.data;
      total = result.data.length;
    }

    processedData = { entregadores, total };
  }

  console.log('[fetchEntregadoresData] Dados processados:', { entregadores: processedData.entregadores.length, total: processedData.total });

  return { data: processedData, error: null };
}

/**
 * Busca dados de Valores
 */
async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: any }> {
  const { tab, filterPayload } = options;

  // Remover p_turno pois a função não suporta
  const { p_turno, ...restPayload } = filterPayload;
  const listarValoresPayload = {
    ...restPayload,
  };

  // LOG FORÇADO PARA DEBUG - REMOVER DEPOIS
  console.log('[fetchValoresData] Chamando RPC listar_valores_entregadores com payload:', listarValoresPayload);

  const result = await safeRpc<any>('listar_valores_entregadores', listarValoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    console.log('[fetchValoresData] ERRO recebido:', result.error);
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
    // A função retorna um objeto JSONB com a estrutura { entregadores: [...] }
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      const dataObj = result.data as any;
      // Verificar se tem a propriedade 'entregadores'
      if ('entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
        processedData = dataObj.entregadores;
      } else if ('valores' in dataObj && Array.isArray(dataObj.valores)) {
        // Fallback para estrutura alternativa
        processedData = dataObj.valores;
      } else {
        // Se não tiver array, tentar usar o objeto inteiro como único item
        safeLog.warn('[fetchValoresData] Estrutura de dados inesperada:', dataObj);
        processedData = [];
      }
    } else if (Array.isArray(result.data)) {
      // Se já for array, usar diretamente
      processedData = result.data;
    }
  }

  console.log('[fetchValoresData] Dados processados:', { count: processedData.length, sample: processedData[0] });

  return { data: processedData, error: null };
}

/**
 * Busca dados baseado no tipo de tab
 */
export async function fetchTabData(options: FetchOptions): Promise<{ data: TabData; error: any }> {
  const { tab } = options;

  // LOG FORÇADO PARA DEBUG - REMOVER DEPOIS
  console.log(`🟢 [fetchTabData] Iniciando fetch para tab: "${tab}"`);

  try {
    switch (tab) {
      case 'dashboard':
        // Dashboard usa useDashboardMainData, não precisa buscar dados aqui
        return { data: null, error: null };

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

