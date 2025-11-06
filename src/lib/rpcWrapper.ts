/**
 * Wrapper seguro para chamadas RPC com validação e timeout
 */
import { supabase } from './supabaseClient';
import { validateFilterPayload } from './validate';

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
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { timeout = DEFAULT_TIMEOUT, validateParams = true } = options;

  try {
    // Validar parâmetros se solicitado
    let validatedParams = params;
    if (validateParams && params && typeof params === 'object') {
      try {
        validatedParams = validateFilterPayload(params);
      } catch (validationError: any) {
        if (IS_DEV) {
          console.warn(`Validação falhou para ${functionName}:`, validationError);
        }
        // Em produção, usar parâmetros originais mas limitar arrays
        validatedParams = sanitizeParams(params);
      }
    }

    // Criar promise com timeout
    const rpcPromise = supabase.rpc(functionName, validatedParams);
    
    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: {
            message: 'A requisição demorou muito para responder. Tente novamente.',
            code: 'TIMEOUT'
          }
        });
      }, timeout);
    });

    const result = await Promise.race([rpcPromise, timeoutPromise]);
    
    // Se houver erro, sanitizar mensagem em produção
    if (result.error) {
      result.error = sanitizeError(result.error);
    }

    return result;
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

  // Limitar tamanho de strings
  if (sanitized.p_praca && typeof sanitized.p_praca === 'string') {
    sanitized.p_praca = sanitized.p_praca.substring(0, 100);
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

