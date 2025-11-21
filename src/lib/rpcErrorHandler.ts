/**
 * Tratamento de erros RPC com retry automático
 * Centraliza lógica de retry para erros 500 e rate limit
 */

import { safeLog } from './errorHandler';
import type { RpcError } from '@/types/rpc';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Opções para retry de erros RPC
 */
export interface RpcRetryOptions {
  /** Número máximo de tentativas */
  maxRetries?: number;
  /** Delay inicial entre tentativas (ms) */
  initialDelay?: number;
  /** Delay máximo entre tentativas (ms) */
  maxDelay?: number;
  /** Multiplicador de delay exponencial */
  backoffMultiplier?: number;
  /** Se deve retry para erros 500 */
  retryOn500?: boolean;
  /** Se deve retry para rate limit */
  retryOnRateLimit?: boolean;
  /** Callback antes de cada retry */
  onRetry?: (attempt: number, error: RpcError) => void;
}

/**
 * Verifica se um erro é um erro 500 (Internal Server Error)
 */

export function is500Error(error: unknown): boolean {
  const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string } : null;
  const errorCode = errorObj?.code || '';
  const errorMessage = String(errorObj?.message || '');
  return errorCode === 'PGRST301' || 
         errorMessage.includes('500') || 
         errorMessage.includes('Internal Server Error');
}

/**
 * Verifica se um erro é rate limit
 */
export function isRateLimitError(error: unknown): boolean {
  const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string } : null;
  const errorCode = errorObj?.code || '';
  const errorMessage = String(errorObj?.message || '');
  return errorCode === 'RATE_LIMIT_EXCEEDED' ||
         errorMessage.includes('rate limit') ||
         errorMessage.includes('too many requests') ||
         errorMessage.includes('429');
}

/**
 * Trata erro RPC com retry automático
 * 
 * @param error - Erro retornado pela chamada RPC
 * @param retryFn - Função para retentar a chamada
 * @param options - Opções de retry
 * @returns Se deve fazer retry
 */
export async function handleRpcErrorWithRetry(
  error: any,
  retryFn: () => Promise<any>,
  options: RpcRetryOptions = {}
): Promise<{ shouldRetry: boolean; delay?: number }> {
  const {
    maxRetries = 3,
    initialDelay = 2000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryOn500 = true,
    retryOnRateLimit = true,
    onRetry
  } = options;

  const is500 = is500Error(error);
  const isRateLimit = isRateLimitError(error);

  // Verificar se deve fazer retry
  if (!retryOn500 && is500) {
    return { shouldRetry: false };
  }

  if (!retryOnRateLimit && isRateLimit) {
    return { shouldRetry: false };
  }

  if (!is500 && !isRateLimit) {
    return { shouldRetry: false };
  }

  // Calcular delay baseado no tipo de erro
  let delay = initialDelay;
  if (isRateLimit) {
    // Rate limit geralmente precisa de mais tempo
    delay = Math.min(initialDelay * 2, maxDelay);
  } else if (is500) {
    // Erro 500 pode ser temporário, usar delay padrão
    delay = initialDelay;
  }

  if (IS_DEV) {
    if (is500) {
      safeLog.warn(`Erro 500 detectado. Aguardando ${delay}ms antes de tentar novamente...`);
    } else if (isRateLimit) {
      safeLog.warn(`Rate limit detectado. Aguardando ${delay}ms antes de tentar novamente...`);
    }
  }

  if (onRetry) {
    onRetry(1, error);
  }

  return {
    shouldRetry: true,
    delay
  };
}

/**
 * Executa uma função com retry automático para erros 500 e rate limit
 */
export async function executeWithRpcRetry<T>(
  fn: () => Promise<{ data: T | null; error: RpcError | null }>,
  options: RpcRetryOptions = {}
): Promise<{ data: T | null; error: RpcError | null }> {
  const {
    maxRetries = 3,
    initialDelay = 2000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryOn500 = true,
    retryOnRateLimit = true,
    onRetry
  } = options;

  let lastError: RpcError | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();

      // Se não houver erro, retornar resultado
      if (!result.error) {
        return result;
      }

      lastError = result.error;

      // Verificar se deve fazer retry
      const is500 = is500Error(result.error);
      const isRateLimit = isRateLimitError(result.error);

      if (!retryOn500 && is500) {
        return result;
      }

      if (!retryOnRateLimit && isRateLimit) {
        return result;
      }

      if (!is500 && !isRateLimit) {
        return result;
      }

      // Se é a última tentativa, retornar erro
      if (attempt >= maxRetries) {
        if (IS_DEV) {
          safeLog.error(`Máximo de tentativas (${maxRetries + 1}) atingido. Último erro:`, lastError);
        }
        return result;
      }

      // Calcular delay para próxima tentativa
      if (isRateLimit) {
        delay = Math.min(initialDelay * 2 * (attempt + 1), maxDelay);
      } else {
        delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
      }

      if (IS_DEV) {
        safeLog.warn(`Tentativa ${attempt + 1}/${maxRetries + 1} falhou. Aguardando ${delay}ms...`);
      }

      if (onRetry) {
        onRetry(attempt + 1, result.error);
      }

      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error && typeof error === 'object' && 'code' in error && 'message' in error
        ? error as RpcError
        : { code: 'UNKNOWN', message: String(error) };
      
      // Se é a última tentativa, lançar erro
      if (attempt >= maxRetries) {
        throw error;
      }

      // Verificar se deve fazer retry
      const is500 = is500Error(error);
      const isRateLimit = isRateLimitError(error);

      if ((!retryOn500 && is500) || (!retryOnRateLimit && isRateLimit) || (!is500 && !isRateLimit)) {
        throw error;
      }

      // Calcular delay
      delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

      if (onRetry) {
        const rpcError: RpcError = error && typeof error === 'object' && 'code' in error && 'message' in error
          ? error as RpcError
          : { code: 'UNKNOWN', message: String(error) };
        onRetry(attempt + 1, rpcError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Se chegou aqui, retornar último erro
  return {
    data: null,
    error: lastError
  };
}

