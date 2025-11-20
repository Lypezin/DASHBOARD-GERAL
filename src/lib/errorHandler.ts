/**
 * Utilitário para tratamento seguro de erros
 */
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Mapeamento de códigos de erro para mensagens genéricas
 */
const ERROR_MESSAGES: Record<string, string> = {
  '42883': 'Função não configurada. Entre em contato com o administrador.',
  '42P01': 'Recurso não disponível no momento.',
  'PGRST116': 'Recurso não encontrado.',
  'TIMEOUT': 'A requisição demorou muito para responder. Tente novamente.',
  '23505': 'Dados duplicados. Verifique as informações.',
  '23503': 'Erro de referência. Verifique os dados.',
  '23502': 'Campo obrigatório não preenchido.',
  'PGRST301': 'Muitas requisições. Aguarde um momento.',
  'PGRST202': 'Erro de autenticação. Faça login novamente.',
};

/**
 * Obtém mensagem de erro segura (não expõe detalhes em produção)
 * 
 * Esta função sanitiza mensagens de erro para evitar expor informações sensíveis.
 * Em produção, retorna mensagens genéricas baseadas em códigos de erro.
 * Em desenvolvimento, inclui mais detalhes para facilitar o debug.
 * 
 * @param {unknown} error - O erro a ser processado (pode ser Error, string, ou qualquer tipo)
 * @returns {string} Mensagem de erro sanitizada e segura para exibição
 * 
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (err) {
 *   const message = getSafeErrorMessage(err);
 *   setError(message);
 * }
 * ```
 */
interface ErrorWithCode {
  code?: string;
  error_code?: string;
  status?: string;
  message?: string;
  error?: { message?: string };
}

export function getSafeErrorMessage(error: unknown): string {
  if (!error) {
    return 'Ocorreu um erro. Tente novamente mais tarde.';
  }

  // Se for string, retornar diretamente (já deve estar sanitizada)
  if (typeof error === 'string') {
    return error;
  }

  // Tentar obter código de erro
  const err = error as ErrorWithCode;
  const errorCode = err.code || err.error_code || err.status;

  // Se tiver mensagem genérica mapeada, usar ela
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Em produção, retornar mensagem genérica
  if (IS_PROD) {
    return ERROR_MESSAGES.DEFAULT || 'Ocorreu um erro. Tente novamente mais tarde.';
  }

  // Em desenvolvimento, incluir mais detalhes
  return err.message || err.error?.message || 'Ocorreu um erro. Tente novamente mais tarde.';
}

/**
 * Sanitiza objeto de erro removendo informações sensíveis
 * 
 * Remove campos sensíveis e limita a profundidade de objetos de erro.
 * Em produção, remove stack traces e detalhes que possam expor informações.
 * 
 * @param {unknown} error - O erro a ser sanitizado
 * @returns {SanitizedError} Objeto de erro sanitizado com apenas informações seguras
 * 
 * @example
 * ```typescript
 * const sanitized = sanitizeError(err);
 * console.log(sanitized.message); // Mensagem segura
 * ```
 */
interface SanitizedError {
  message: string;
  code?: string;
  details?: unknown;
  hint?: string;
  stack?: string;
}

export function sanitizeError(error: unknown): SanitizedError {
  if (!error) {
    return { message: 'Erro desconhecido' };
  }

  const err = error as ErrorWithCode & { details?: unknown; hint?: string; stack?: string };
  const sanitized: SanitizedError = {
    message: getSafeErrorMessage(error),
  };

  // Em desenvolvimento, incluir código e detalhes
  if (IS_DEV) {
    sanitized.code = err.code || err.error_code;
    sanitized.details = err.details;
    sanitized.hint = err.hint;
    sanitized.stack = err.stack;
  } else {
    // Em produção, apenas código (sem detalhes sensíveis)
    sanitized.code = err.code || err.error_code || 'UNKNOWN_ERROR';
  }

  return sanitized;
}

/**
 * Log seguro (não expõe dados sensíveis em produção)
 * 
 * Sistema de logging que apenas exibe logs em desenvolvimento.
 * Em produção, os logs são silenciados para evitar exposição de informações.
 * Todos os dados são sanitizados antes de serem logados.
 * 
 * @example
 * ```typescript
 * safeLog.info('Operação iniciada', { userId: 123 });
 * safeLog.error('Erro na operação', error);
 * safeLog.warn('Aviso importante', { data });
 * ```
 */
export const safeLog = {
  /**
   * Log de informações (apenas em desenvolvimento)
   * 
   * @param {string} message - Mensagem a ser logada
   * @param {unknown} [data] - Dados opcionais a serem logados (serão sanitizados)
   */
  info: (message: string, data?: unknown) => {
    if (IS_DEV) {
      console.log(message, data ? sanitizeLogData(data) : '');
    }
  },
  /**
   * Log de erros (apenas em desenvolvimento)
   * 
   * @param {string} message - Mensagem de erro
   * @param {unknown} [error] - Objeto de erro opcional (será sanitizado)
   */
  error: (message: string, error?: unknown) => {
    if (IS_DEV) {
      console.error(message, error ? sanitizeError(error) : '');
    } else {
      // Em produção, enviar para serviço de logging (Sentry, LogRocket, etc.)
      // Por enquanto, apenas não logar
    }
  },
  /**
   * Log de avisos (apenas em desenvolvimento)
   * 
   * @param {string} message - Mensagem de aviso
   * @param {unknown} [data] - Dados opcionais a serem logados (serão sanitizados)
   */
  warn: (message: string, data?: unknown) => {
    if (IS_DEV) {
      console.warn(message, data ? sanitizeLogData(data) : '');
    }
  },
};

/**
 * Sanitiza dados para logging (remove campos sensíveis)
 */
function sanitizeLogData(data: unknown): unknown {
  if (!data) return data;

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.slice(0, 10).map(sanitizeLogData);
    }
    
    // Para objetos, criar uma cópia tipada
    const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    
    // Remover campos sensíveis
    const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'auth_token', 'session'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Limitar profundidade de objetos
    const keys = Object.keys(sanitized);
    if (keys.length > 20) {
      const limited: Record<string, unknown> = {};
      for (let i = 0; i < 20; i++) {
        limited[keys[i]] = sanitizeLogData(sanitized[keys[i]]);
      }
      return limited;
    }

    return sanitized;
  }

  return data;
}

