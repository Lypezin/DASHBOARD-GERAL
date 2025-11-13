/**
 * Wrapper seguro para chamadas RPC com validação e timeout
 */
import { supabase } from './supabaseClient';
import { validateFilterPayload } from './validate';
import { safeLog } from './errorHandler';
import { rpcRateLimiter } from './rateLimiter';

const IS_DEV = process.env.NODE_ENV === 'development';
const DEFAULT_TIMEOUT = 30000; // 30 segundos

/**
 * Executa uma chamada RPC com timeout e validação
 */
export async function safeRpc<T = any>(
  functionName: string,
  params: any = {},
  options: {
    timeout?: number;
    validateParams?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { timeout = DEFAULT_TIMEOUT, validateParams = true, signal } = options;
  
  // Verificar se foi abortado antes de começar
  if (signal?.aborted) {
    return {
      data: null,
      error: {
        message: 'Requisição cancelada',
        code: 'ABORTED'
      }
    };
  }

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
    let validatedParams = params;
    // IMPORTANTE: Para funções sem parâmetros, o Supabase JS client aceita:
    // - Não passar o segundo parâmetro: supabase.rpc('function_name')
    // - Passar undefined: supabase.rpc('function_name', undefined)
    // - Passar {} vazio: supabase.rpc('function_name', {})
    // Mas o PostgREST pode reclamar se passarmos {} quando a função não espera parâmetros
    // Vamos usar undefined para funções sem parâmetros
    if (params === null || params === undefined || (typeof params === 'object' && Object.keys(params).length === 0)) {
      // Para funções sem parâmetros, usar undefined
      validatedParams = undefined;
    } else if (validateParams && params && typeof params === 'object') {
      try {
        validatedParams = validateFilterPayload(params);
      } catch (validationError: any) {
        if (IS_DEV) {
          safeLog.warn(`Validação falhou para ${functionName}:`, validationError);
        }
        // Em produção, usar parâmetros originais mas limitar arrays
        validatedParams = sanitizeParams(params);
      }
    }

    // Criar promise com timeout e suporte a AbortController
    // IMPORTANTE: Para funções sem parâmetros, passar undefined é a forma correta
    // O Supabase JS client aceita undefined e não envia parâmetros no body da requisição
    // Isso evita erro 400 do PostgREST quando a função não espera parâmetros
    const rpcOptions: any = {};
    if (signal) {
      rpcOptions.signal = signal;
    }
    
    const rpcPromise = validatedParams === undefined
      ? (supabase.rpc as any)(functionName, rpcOptions) // Chamar com opções
      : supabase.rpc(functionName, validatedParams, rpcOptions);
    
    // Criar timeout que também respeita o AbortSignal
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => {
      timeoutId = setTimeout(() => {
        if (!signal?.aborted) {
          resolve({
            data: null,
            error: {
              message: 'A requisição demorou muito para responder. Tente novamente.',
              code: 'TIMEOUT'
            }
          });
        }
      }, timeout);
    });

    // Limpar timeout se abortado
    if (signal) {
      signal.addEventListener('abort', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    }

    try {
      const result = await Promise.race([rpcPromise, timeoutPromise]);
      
      // Limpar timeout se ainda estiver ativo
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Verificar se foi abortado
      if (signal?.aborted) {
        return {
          data: null,
          error: {
            message: 'Requisição cancelada',
            code: 'ABORTED'
          }
        };
      }
    
      // Se houver erro, sanitizar mensagem em produção
      if (result.error) {
        // Verificar se é erro 400/404 (função não encontrada ou parâmetros inválidos)
        const errorCode = (result.error as any)?.code;
        const errorMessage = String((result.error as any)?.message || '');
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
    } catch (error: any) {
      // Limpar timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Ignorar erros de abort
      if (error?.name === 'AbortError' || signal?.aborted) {
        return {
          data: null,
          error: {
            message: 'Requisição cancelada',
            code: 'ABORTED'
          }
        };
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

/**
 * Sanitiza parâmetros limitando tamanho de arrays
 */
function sanitizeParams(params: any): any {
  const sanitized = { ...params };
  
  // Limitar arrays
  if (sanitized.p_sub_praca && Array.isArray(sanitized.p_sub_praca)) {
    sanitized.p_sub_praca = sanitized.p_sub_praca.slice(0, 50).join(',');
  } else if (typeof sanitized.p_sub_praca === 'string' && sanitized.p_sub_praca.includes(',')) {
    const items = sanitized.p_sub_praca.split(',').slice(0, 50);
    sanitized.p_sub_praca = items.join(',');
  }
  
  if (sanitized.p_origem && Array.isArray(sanitized.p_origem)) {
    sanitized.p_origem = sanitized.p_origem.slice(0, 50).join(',');
  } else if (typeof sanitized.p_origem === 'string' && sanitized.p_origem.includes(',')) {
    const items = sanitized.p_origem.split(',').slice(0, 50);
    sanitized.p_origem = items.join(',');
  }
  
  if (sanitized.p_turno && Array.isArray(sanitized.p_turno)) {
    sanitized.p_turno = sanitized.p_turno.slice(0, 50).join(',');
  } else if (typeof sanitized.p_turno === 'string' && sanitized.p_turno.includes(',')) {
    const items = sanitized.p_turno.split(',').slice(0, 50);
    sanitized.p_turno = items.join(',');
  }

  // Validar números
  if (sanitized.p_ano !== undefined && sanitized.p_ano !== null) {
    const ano = parseInt(String(sanitized.p_ano), 10);
    if (isNaN(ano) || ano < 2000 || ano > 2100) {
      delete sanitized.p_ano;
    } else {
      sanitized.p_ano = ano;
    }
  }

  if (sanitized.p_semana !== undefined && sanitized.p_semana !== null) {
    const semana = parseInt(String(sanitized.p_semana), 10);
    if (isNaN(semana) || semana < 1 || semana > 53) {
      delete sanitized.p_semana;
    } else {
      sanitized.p_semana = semana;
    }
  }

  // Limitar praças (pode ser string única ou múltiplas separadas por vírgula)
  if (sanitized.p_praca) {
    if (Array.isArray(sanitized.p_praca)) {
      sanitized.p_praca = sanitized.p_praca.slice(0, 50).join(',');
    } else if (typeof sanitized.p_praca === 'string') {
      if (sanitized.p_praca.includes(',')) {
        const items = sanitized.p_praca.split(',').slice(0, 50);
        sanitized.p_praca = items.join(',');
      } else {
        sanitized.p_praca = sanitized.p_praca.substring(0, 100);
      }
    }
  }

  return sanitized;
}

/**
 * Sanitiza mensagens de erro para não expor informações sensíveis em produção
 */
function sanitizeError(error: any): any {
  if (!error) return error;

  const IS_PROD = process.env.NODE_ENV === 'production';

  // Mapeamento de códigos de erro para mensagens genéricas
  const ERROR_MESSAGES: Record<string, string> = {
    '42883': 'Função não configurada. Entre em contato com o administrador.',
    '42P01': 'Recurso não disponível no momento.',
    'PGRST116': 'Recurso não encontrado.',
    'TIMEOUT': 'A requisição demorou muito para responder. Tente novamente.',
    '23505': 'Dados duplicados. Verifique as informações.',
    '23503': 'Erro de referência. Verifique os dados.',
    '23502': 'Campo obrigatório não preenchido.',
  };

  const errorCode = error.code || error.error_code;
  const genericMessage = ERROR_MESSAGES[errorCode] || 'Ocorreu um erro. Tente novamente mais tarde.';

  if (IS_PROD) {
    // Em produção, retornar mensagem genérica
    return {
      message: genericMessage,
      code: errorCode || 'UNKNOWN_ERROR',
      // Não incluir detalhes sensíveis
    };
  } else {
    // Em desenvolvimento, incluir mais detalhes
    return {
      message: error.message || genericMessage,
      code: errorCode,
      details: error.details,
      hint: error.hint,
    };
  }
}

