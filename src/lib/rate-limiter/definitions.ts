import { checkRateLimit } from './core';

/**
 * Rate limiter para requisições RPC
 * Aumentado para permitir mudanças rápidas de tab sem bloquear
 */
export function rpcRateLimiter() {
    return checkRateLimit({
        maxRequests: 60, // 60 requisições (aumentado de 30)
        windowMs: 60000, // por minuto
        keyGenerator: 'rpc-requests',
    });
}

/**
 * Rate limiter para uploads
 */
export function uploadRateLimiter() {
    return checkRateLimit({
        maxRequests: 5, // 5 uploads
        windowMs: 300000, // por 5 minutos
        keyGenerator: 'upload-requests',
    });
}

/**
 * Rate limiter para login
 */
export function loginRateLimiter(identifier: string) {
    return checkRateLimit({
        maxRequests: 5, // 5 tentativas
        windowMs: 900000, // por 15 minutos
        keyGenerator: `login-${identifier}`,
    });
}

/**
 * Rate limiter genérico por IP (simulado no cliente)
 */
export function ipRateLimiter() {
    // No cliente, não temos acesso real ao IP
    // Usamos um identificador baseado no navegador
    const browserId = typeof window !== 'undefined'
        ? localStorage.getItem('browser-id') || `browser-${Date.now()}`
        : 'server';

    if (typeof window !== 'undefined' && !localStorage.getItem('browser-id')) {
        localStorage.setItem('browser-id', browserId);
    }

    return checkRateLimit({
        maxRequests: 100, // 100 requisições
        windowMs: 60000, // por minuto
        keyGenerator: `ip-${browserId}`,
    });
}
