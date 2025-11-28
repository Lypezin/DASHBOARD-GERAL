/**
 * Wrapper seguro para chamadas RPC com validação e timeout
 */
import { supabase } from './supabaseClient';
import { validateFilterPayload } from './validate';
import { safeLog } from './errorHandler';
import { rpcRateLimiter } from './rateLimiter';
import { sanitizeParams, sanitizeError } from './rpcUtils';
import { RpcParams, RpcResult, RpcOptions, RpcError, SanitizedRpcParams } from '@/types/rpc';

import { RPC_TIMEOUTS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';
const DEFAULT_TIMEOUT = RPC_TIMEOUTS.DEFAULT;

/**
 * Executa uma chamada RPC com timeout e validação
 * 
 * Wrapper seguro para chamadas RPC do Supabase que inclui:
 * - Rate limiting automático
 * - Timeout configurável (padrão: 30 segundos)
 * - Validação de parâmetros
 * - Tratamento de erros
 * 
 * NOTA: Removido suporte a AbortSignal pois o Supabase JS client não suporta nativamente.
 * O cancelamento é feito no nível do hook através de verificação de estado.
 * 
 * @template T - Tipo do retorno esperado da função RPC
 * @param {string} functionName - Nome da função RPC a ser chamada
 * @param {RpcParams} [params={}] - Parâmetros a serem passados para a função RPC
 * @param {RpcOptions} [options={}] - Opções de configuração
 * @param {number} [options.timeout=30000] - Timeout em milissegundos (padrão: 30000)
 * @param {boolean} [options.validateParams=true] - Se deve validar os parâmetros antes de enviar
 * @returns {Promise<RpcResult<T>>} Objeto com dados ou erro
 * 
 * @example
 * ```typescript
 * const { data, error } = await safeRpc<MyDataType>('get_my_data', {
 *   p_id: 123,
 *   p_filter: 'active'
 * }, {
 *   timeout: 60000,
 *   validateParams: true
 * });
 * 
 * if (error) {
 *   console.error('Erro:', error);
 * } else {
 *   console.log('Dados:', data);
 * }
 * ```
 */
export async function safeRpc<T = unknown>(
  functionName: string,
  params: RpcParams = {},
  options: RpcOptions = {}
): Promise<RpcResult<T>> {
  const { timeout = DEFAULT_TIMEOUT, validateParams = true } = options;

  try {
    // Verificar rate limiting
    const rateLimit = rpcRateLimiter();
    if (!rateLimit.allowed) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return {
        data: null,
        error: {
          message: `Muitas requisições. Aguarde ${waitTime} segundos antes de tentar novamente.`,
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimit.resetTime,
        },
      };
    }

    // Validar parâmetros se solicitado
    let validatedParams: RpcParams | undefined = params;
    // IMPORTANTE: Para funções sem parâmetros, o Supabase JS client aceita:
    // - Não passar o segundo parâmetro: supabase.rpc('function_name')
    // - Passar undefined: supabase.rpc('function_name', undefined)
    // - Passar {} vazio: supabase.rpc('function_name', {})
    // Mas o PostgREST pode reclamar se passarmos {} quando a função não espera parâmetros
    // Vamos usar undefined para funções sem parâmetros

    // Normalizar parâmetros: converter undefined para null e manter null como está
    // Isso garante que funções RPC que esperam null para usar DEFAULT funcionem corretamente
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const normalizedParams: RpcParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Converter undefined para null, manter null como está
        normalizedParams[key] = value === undefined ? null : value;
      }
      validatedParams = normalizedParams;
    } else if (params === null || params === undefined || (typeof params === 'object' && Object.keys(params).length === 0)) {
      // Para funções sem parâmetros, usar undefined
      validatedParams = undefined;
    }

    // Aplicar validação se solicitado e se ainda temos parâmetros
    if (validateParams && validatedParams && typeof validatedParams === 'object' && validatedParams !== undefined) {
      try {
        validatedParams = validateFilterPayload(validatedParams) as RpcParams;
      } catch (validationError: unknown) {
        if (IS_DEV) {
          safeLog.warn(`Validação falhou para ${functionName}:`, validationError);
        }
        // Em produção, usar parâmetros originais mas limitar arrays
        // validatedParams não pode ser undefined aqui porque já passou pela verificação acima
        if (validatedParams) {
          validatedParams = sanitizeParams(validatedParams);
        }
      }
    }

    // Verificar se o cliente Supabase está usando mock (placeholder)
    // Se estiver, tentar recriar o cliente antes de fazer a requisição
    try {
      const clientUrl = (supabase as any).supabaseUrl;
      if (clientUrl === 'https://placeholder.supabase.co' && typeof window !== 'undefined') {
        const recreateFn = (supabase as any)._recreate;
        if (recreateFn && typeof recreateFn === 'function') {
          recreateFn();
        }
        safeLog.error(
          `[safeRpc] ⚠️ Tentando fazer requisição com cliente mock! ` +
          `Variáveis de ambiente não estão disponíveis. ` +
          `Função: ${functionName}. ` +
          `IMPORTANTE: Variáveis NEXT_PUBLIC_ são injetadas durante o BUILD. ` +
          `Após configurar no Vercel, faça um NOVO BUILD (não apenas redeploy).`
        );
      }
    } catch (e) {
      // Ignorar erro ao verificar URL do cliente
    }

    // Verificar se supabase.rpc está disponível
    // Isso pode falhar durante SSR/prefetch do Next.js
    if (!supabase.rpc || typeof supabase.rpc !== 'function') {
      return {
        data: null,
        error: {
          message: 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.',
          code: 'CLIENT_NOT_READY',
        },
      };
    }

    // Criar promise com timeout
    // IMPORTANTE: Para funções sem parâmetros, passar undefined é a forma correta
    // O Supabase JS client aceita undefined e não envia parâmetros no body da requisição
    // Isso evita erro 400 do PostgREST quando a função não espera parâmetros
    let rpcPromise: Promise<any>;
    try {
      rpcPromise = validatedParams === undefined
        ? (supabase.rpc as any)(functionName) // Chamar sem segundo parâmetro
        : supabase.rpc(functionName, validatedParams);

      // Verificar se a promise foi criada corretamente
      if (!rpcPromise || typeof rpcPromise.then !== 'function') {
        return {
          data: null,
          error: {
            message: 'Erro ao criar requisição RPC. Tente novamente.',
            code: 'RPC_CREATION_ERROR',
          },
        };
      }
    } catch (rpcError: any) {
      // Capturar erros durante a criação da promise (pode acontecer durante prefetch)
      return {
        data: null,
        error: {
          message: typeof window === 'undefined'
            ? 'Requisição RPC não disponível no servidor. Aguarde o carregamento no cliente.'
            : 'Erro ao criar requisição RPC. Tente novamente.',
          code: 'RPC_INIT_ERROR',
          details: IS_DEV ? String(rpcError?.message || rpcError) : undefined,
        },
      };
    }

    // Criar timeout
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<RpcResult<null>>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          data: null,
          error: {
            message: 'A requisição demorou muito para responder. Tente novamente.',
            code: 'TIMEOUT'
          }
        });
      }, timeout);
    });

    try {
      const result = await Promise.race([rpcPromise, timeoutPromise]);

      // Limpar timeout se ainda estiver ativo
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Se houver erro, sanitizar mensagem em produção
      if (result.error) {
        // Verificar se é erro 400/404 (função não encontrada ou parâmetros inválidos)
        const errorCode = (result.error as RpcError)?.code;
        const errorMessage = String((result.error as RpcError)?.message || '');
        const is400or404 = errorCode === 'PGRST116' || errorCode === '42883' ||
          errorCode === 'PGRST204' || // Bad Request
          errorMessage.includes('400') ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('invalid input') ||
          errorMessage.includes('structure of query does not match'); // Erro de tipo de retorno

        // Silenciar erros 400/404 completamente (não logar em nenhum ambiente)
        // Esses erros são esperados em certas situações e não devem aparecer no console
        if (is400or404) {
          // Retornar erro silenciosamente sem logar
          result.error = {
            code: errorCode || '400',
            message: 'Requisição inválida',
          };
        } else {
          result.error = sanitizeError(result.error);
        }
      }

      return result;
    } catch (error) {
      // Limpar timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return {
        data: null,
        error: sanitizeError(error)
      };
    }
  } catch (error: any) {
    return {
      data: null,
      error: sanitizeError(error)
    };
  }
}



