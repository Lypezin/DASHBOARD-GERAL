
/**
 * Core Rate Limiter Logic
 */
import { requestStore, RequestRecord } from './store';
import { initializeCleanup } from './cleanup';

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (() => string) | string;
}

// Re-export functions for backward compatibility if used directly
export { cleanupRateLimiter } from './cleanup';

// Inicializar cleanup apenas no cliente
if (typeof window !== 'undefined') {
    initializeCleanup();
}

/**
 * Verifica se uma requisição está dentro do limite de taxa
 */
export function checkRateLimit(config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
} {
    const key = typeof config.keyGenerator === 'function'
        ? config.keyGenerator()
        : config.keyGenerator || 'default';

    const now = Date.now();
    const record = requestStore.get(key);

    if (!record || now > record.resetTime) {
        const newRecord: RequestRecord = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        requestStore.set(key, newRecord);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: newRecord.resetTime,
        };
    }

    if (record.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime,
        };
    }

    record.count++;
    requestStore.set(key, record);

    return {
        allowed: true,
        remaining: config.maxRequests - record.count,
        resetTime: record.resetTime,
    };
}
