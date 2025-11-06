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
 */
export function getSafeErrorMessage(error: any): string {
  if (!error) {
    return 'Ocorreu um erro. Tente novamente mais tarde.';
  }

  // Se for string, retornar diretamente (já deve estar sanitizada)
  if (typeof error === 'string') {
    return error;
  }

  // Tentar obter código de erro
  const errorCode = error.code || error.error_code || error.status;

  // Se tiver mensagem genérica mapeada, usar ela
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Em produção, retornar mensagem genérica
  if (IS_PROD) {
    return ERROR_MESSAGES.DEFAULT || 'Ocorreu um erro. Tente novamente mais tarde.';
  }

  // Em desenvolvimento, incluir mais detalhes
  return error.message || error.error?.message || 'Ocorreu um erro. Tente novamente mais tarde.';
}

/**
 * Sanitiza objeto de erro removendo informações sensíveis
 */
export function sanitizeError(error: any): any {
  if (!error) return error;

  const sanitized: any = {
    message: getSafeErrorMessage(error),
  };

  // Em desenvolvimento, incluir código e detalhes
  if (IS_DEV) {
    sanitized.code = error.code || error.error_code;
    sanitized.details = error.details;
    sanitized.hint = error.hint;
    sanitized.stack = error.stack;
  } else {
    // Em produção, apenas código (sem detalhes sensíveis)
    sanitized.code = error.code || error.error_code || 'UNKNOWN_ERROR';
  }

  return sanitized;
}

/**
 * Log seguro (não expõe dados sensíveis em produção)
 */
export const safeLog = {
  info: (message: string, data?: any) => {
    if (IS_DEV) {
      console.log(message, data ? sanitizeLogData(data) : '');
    }
  },
  error: (message: string, error?: any) => {
    if (IS_DEV) {
      console.error(message, error ? sanitizeError(error) : '');
    } else {
      // Em produção, enviar para serviço de logging (Sentry, LogRocket, etc.)
      // Por enquanto, apenas não logar
    }
  },
  warn: (message: string, data?: any) => {
    if (IS_DEV) {
      console.warn(message, data ? sanitizeLogData(data) : '');
    }
  },
};

/**
 * Sanitiza dados para logging (remove campos sensíveis)
 */
function sanitizeLogData(data: any): any {
  if (!data) return data;

  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // Remover campos sensíveis
    const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'auth_token', 'session'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Limitar tamanho de arrays
    if (Array.isArray(sanitized)) {
      return sanitized.slice(0, 10).map(sanitizeLogData);
    }

    // Limitar profundidade de objetos
    const keys = Object.keys(sanitized);
    if (keys.length > 20) {
      const limited: any = {};
      for (let i = 0; i < 20; i++) {
        limited[keys[i]] = sanitizeLogData(sanitized[keys[i]]);
      }
      return limited;
    }

    return sanitized;
  }

  return data;
}

