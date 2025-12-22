/**
 * Core Rate Limiter Logic
 */

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (() => string) | string;
}

interface RequestRecord {
    count: number;
    resetTime: number;
}

// Armazenamento em memória (para cliente)
const requestStore = new Map<string, RequestRecord>();

/**
 * Limpa registros expirados periodicamente
 */
function cleanupExpiredRecords() {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
        if (now > record.resetTime) {
            requestStore.delete(key);
        }
    }
}

// Limpar registros expirados a cada minuto
let cleanupInterval: NodeJS.Timeout | null = null;
let beforeUnloadHandler: (() => void) | null = null;
let visibilityChangeHandler: (() => void) | null = null;

/**
 * Inicializa o cleanup periódico de registros expirados
 */
function initializeCleanup() {
    if (typeof window === 'undefined' || cleanupInterval !== null) {
        return;
    }

    cleanupInterval = setInterval(cleanupExpiredRecords, 60000);

    beforeUnloadHandler = () => {
        if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    visibilityChangeHandler = () => {
        if (document.hidden && cleanupInterval) {
            // Pause cleanup if needed
        }
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);
}

/**
 * Limpa todos os listeners e intervals (para testes ou cleanup manual)
 */
export function cleanupRateLimiter() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
    if (beforeUnloadHandler && typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        beforeUnloadHandler = null;
    }
    if (visibilityChangeHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
    }
}

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
