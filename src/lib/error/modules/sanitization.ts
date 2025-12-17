import { ERROR_MESSAGES } from './constants';

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';

interface ErrorWithCode {
    code?: string;
    error_code?: string;
    status?: string;
    message?: string;
    error?: { message?: string };
}

export interface SanitizedError {
    message: string;
    code?: string;
    details?: unknown;
    hint?: string;
    stack?: string;
}

export function getSafeErrorMessage(error: unknown): string {
    if (!error) return 'Ocorreu um erro. Tente novamente mais tarde.';
    if (typeof error === 'string') return error;

    const err = error as ErrorWithCode;
    const errorCode = err.code || err.error_code || err.status;

    if (errorCode && ERROR_MESSAGES[errorCode]) {
        return ERROR_MESSAGES[errorCode];
    }

    if (IS_PROD) {
        return ERROR_MESSAGES.DEFAULT || 'Ocorreu um erro. Tente novamente mais tarde.';
    }

    return err.message || err.error?.message || 'Ocorreu um erro. Tente novamente mais tarde.';
}

export function sanitizeError(error: unknown): SanitizedError {
    if (!error) return { message: 'Erro desconhecido' };

    const err = error as ErrorWithCode & { details?: unknown; hint?: string; stack?: string };
    const sanitized: SanitizedError = {
        message: getSafeErrorMessage(error),
    };

    if (IS_DEV) {
        sanitized.code = err.code || err.error_code;
        sanitized.details = err.details;
        sanitized.hint = err.hint;
        sanitized.stack = err.stack;
    } else {
        sanitized.code = err.code || err.error_code || 'UNKNOWN_ERROR';
    }

    return sanitized;
}

export function sanitizeLogData(data: unknown): unknown {
    if (!data) return data;

    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            return data.slice(0, 10).map(sanitizeLogData);
        }

        const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
        const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'auth_token', 'session'];

        for (const field of sensitiveFields) {
            if (field in sanitized) delete sanitized[field];
        }

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
