
import { requestStore } from './store';

/**
 * Limpa registros expirados periodicamente
 */
export function cleanupExpiredRecords() {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
        if (now > record.resetTime) {
            requestStore.delete(key);
        }
    }
}

// Limpar registros expirados a cada minuto
let cleanupInterval: NodeJS.Timeout | null = null;
let visibilityChangeHandler: (() => void) | null = null;

/**
 * Inicializa o cleanup periódico de registros expirados
 */
export function initializeCleanup() {
    if (typeof window === 'undefined' || cleanupInterval !== null || visibilityChangeHandler !== null) {
        return;
    }

    const startInterval = () => {
        if (cleanupInterval === null) {
            cleanupInterval = setInterval(cleanupExpiredRecords, 60000);
        }
    };

    if (typeof document === 'undefined' || !document.hidden) {
        startInterval();
    }

    visibilityChangeHandler = () => {
        if (document.hidden) {
            if (cleanupInterval) {
                clearInterval(cleanupInterval);
                cleanupInterval = null;
            }
        } else {
            cleanupExpiredRecords();
            startInterval();
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
    if (visibilityChangeHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
    }
}
