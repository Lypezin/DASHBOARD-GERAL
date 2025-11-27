import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { UtrData, EntregadoresData, ValoresEntregador, Entregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchUtrFallback, fetchEntregadoresFallback, fetchValoresFallback } from './fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface FetchOptions {
  filterPayload: FilterPayload;
}

/**
 * Busca dados de UTR
 */
/**
 * Busca dados de UTR
 */
export async function fetchUtrData(options: FetchOptions): Promise<{ data: UtrData | null; error: RpcError | null }> {
  const { filterPayload } = options;

  const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_turno', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
  const utrPayload: FilterPayload = {};

  for (const key of allowedParams) {
    if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
      utrPayload[key] = filterPayload[key];
    }
  }

  const result = await safeRpc<any>('calcular_utr_completo', utrPayload as any, {
    timeout: RPC_TIMEOUTS.DEFAULT,
    validateParams: true
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      try {
        const fallbackData = await fetchUtrFallback(filterPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';

    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchUtrFallback(filterPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
      }
    }

    safeLog.error('Erro ao buscar UTR:', result.error);
    return { data: null, error: result.error };
  }

  let utrData: UtrData | null = null;

  if (result && result.data) {
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      utrData = result.data as UtrData;
    } else {
      safeLog.warn('[fetchUtrData] Estrutura de dados inesperada:', result.data);
      utrData = null;
    }
  }

  return { data: utrData, error: null };
}

/**
 * Busca dados de Entregadores
 */
export async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
  const { filterPayload } = options;

  const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
  const listarEntregadoresPayload: FilterPayload = {};

  for (const key of allowedParams) {
    if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
      listarEntregadoresPayload[key] = filterPayload[key];
    }
  }

  const result = await safeRpc<any>('listar_entregadores_v2', listarEntregadoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      try {
        const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
        if (fallbackData && fallbackData.entregadores.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';

    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
        if (fallbackData) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
      }
    }

    safeLog.error('Erro ao buscar entregadores:', result.error);
    return { data: { entregadores: [], total: 0 }, error: result.error };
  }

  let processedData: EntregadoresData = { entregadores: [], total: 0 };

  if (result && result.data) {
    let entregadores: Record<string, unknown>[] = [];
    let total = 0;

    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      if ('entregadores' in result.data && Array.isArray(result.data.entregadores)) {
        entregadores = result.data.entregadores;
        total = result.data.total !== undefined ? result.data.total : result.data.entregadores.length;
      } else {
        safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', result.data);
        entregadores = [];
        total = 0;
      }
    } else if (Array.isArray(result.data)) {
      entregadores = result.data;
      total = result.data.length;
    }

    processedData = { entregadores: entregadores as unknown as Entregador[], total };
  }

  return { data: processedData, error: null };
}

/**
 * Busca dados de Valores
 */
export async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: RpcError | null }> {
  const { filterPayload } = options;

  const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
  const listarValoresPayload: FilterPayload = {};

  for (const key of allowedParams) {
    if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
      listarValoresPayload[key] = filterPayload[key];
    }
  }

  const result = await safeRpc<any>('listar_valores_entregadores', listarValoresPayload, {
    timeout: RPC_TIMEOUTS.LONG,
    validateParams: false
  });

  if (result.error) {
    const is500 = is500Error(result.error);
    const isRateLimit = isRateLimitError(result.error);

    if (is500) {
      try {
        const fallbackData = await fetchValoresFallback(listarValoresPayload);
        if (fallbackData && fallbackData.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
      }
      throw new Error('RETRY_500');
    }

    if (isRateLimit) {
      throw new Error('RETRY_RATE_LIMIT');
    }

    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';

    if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
      try {
        const fallbackData = await fetchValoresFallback(listarValoresPayload);
        if (fallbackData && fallbackData.length > 0) {
          return { data: fallbackData, error: null };
        }
      } catch (fallbackError) {
        safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
      }

      return {
        data: [],
        error: {
          message: 'A função de listar valores não está disponível. Entre em contato com o administrador.',
          code: 'FUNCTION_NOT_FOUND'
        }
      };
    }

    safeLog.error('Erro ao buscar valores:', result.error);
    return { data: [], error: result.error };
  }

  let processedData: ValoresEntregador[] = [];

  if (result && result.data !== null && result.data !== undefined) {
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      const dataObj = result.data as { entregadores?: ValoresEntregador[]; valores?: ValoresEntregador[] } | null;

      if (dataObj && 'entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
        processedData = dataObj.entregadores;
      } else if (dataObj && 'valores' in dataObj && Array.isArray(dataObj.valores)) {
        processedData = dataObj.valores;
      } else {
        safeLog.warn('[fetchValoresData] Estrutura de dados inesperada:', dataObj);
        processedData = [];
      }
    } else if (Array.isArray(result.data)) {
      processedData = result.data;
    }
  }

  return { data: processedData, error: null };
}

