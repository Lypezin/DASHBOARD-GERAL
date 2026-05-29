import { RpcParams, SanitizedRpcParams, RpcError } from '@/types/rpc';

/**
 * Sanitiza parâmetros limitando tamanho de arrays
 */
export function sanitizeParams(params: RpcParams): SanitizedRpcParams {
    const sanitized = { ...params };

    if (sanitized.p_sub_praca && Array.isArray(sanitized.p_sub_praca)) sanitized.p_sub_praca = sanitized.p_sub_praca.slice(0, 50).join(',');
    else if (typeof sanitized.p_sub_praca === 'string' && sanitized.p_sub_praca.includes(',')) sanitized.p_sub_praca = sanitized.p_sub_praca.split(',').slice(0, 50).join(',');

    if (sanitized.p_origem && Array.isArray(sanitized.p_origem)) sanitized.p_origem = sanitized.p_origem.slice(0, 50).join(',');
    else if (typeof sanitized.p_origem === 'string' && sanitized.p_origem.includes(',')) sanitized.p_origem = sanitized.p_origem.split(',').slice(0, 50).join(',');

    if (sanitized.p_turno && Array.isArray(sanitized.p_turno)) sanitized.p_turno = sanitized.p_turno.slice(0, 50).join(',');
    else if (typeof sanitized.p_turno === 'string' && sanitized.p_turno.includes(',')) sanitized.p_turno = sanitized.p_turno.split(',').slice(0, 50).join(',');

    // Validar números
    if (sanitized.p_ano !== undefined && sanitized.p_ano !== null) {
        const ano = parseInt(String(sanitized.p_ano), 10);
        if (isNaN(ano) || ano < 2000 || ano > 2100) delete sanitized.p_ano; else sanitized.p_ano = ano;
    }

    if (sanitized.p_semana !== undefined && sanitized.p_semana !== null) {
        const semana = parseInt(String(sanitized.p_semana), 10);
        if (isNaN(semana) || semana < 1 || semana > 53) delete sanitized.p_semana; else sanitized.p_semana = semana;
    }

    // Limitar praças
    if (sanitized.p_praca) {
        if (Array.isArray(sanitized.p_praca)) sanitized.p_praca = sanitized.p_praca.slice(0, 50).join(',');
        else if (typeof sanitized.p_praca === 'string') {
            if (sanitized.p_praca.includes(',')) sanitized.p_praca = sanitized.p_praca.split(',').slice(0, 50).join(',');
            else sanitized.p_praca = sanitized.p_praca.substring(0, 100);
        }
    }

    return sanitized;
}

/**
 * Sanitiza mensagens de erro para não expor informações sensíveis em produção
 */
export function sanitizeError(error: unknown): RpcError {
    if (!error) return { message: 'Erro desconhecido', code: 'UNKNOWN' };

    const IS_PROD = process.env.NODE_ENV === 'production';
    const errorObj = error as { code?: string; error_code?: string; message?: string; details?: string; hint?: string };

    // Mapeamento de códigos de erro para mensagens genéricas
    const ERROR_MESSAGES: Record<string, string> = {
        '42883': 'Função não configurada. Entre em contato com o administrador.', '42P01': 'Recurso não disponível no momento.', 'PGRST116': 'Recurso não encontrado.', 'TIMEOUT': 'A requisição demorou muito para responder. Tente novamente.',
        '23505': 'Dados duplicados. Verifique as informações.', '23503': 'Erro de referência. Verifique os dados.', '23502': 'Campo obrigatório não preenchido.',
    };
    const errorCode = errorObj.code || errorObj.error_code;
    const genericMessage = errorCode && ERROR_MESSAGES[errorCode] ? ERROR_MESSAGES[errorCode] : 'Ocorreu um erro. Tente novamente mais tarde.';

    return IS_PROD
        ? { message: genericMessage, code: errorCode || 'UNKNOWN_ERROR' }
        : { message: errorObj.message || genericMessage, code: errorCode, details: errorObj.details, hint: errorObj.hint };
}
