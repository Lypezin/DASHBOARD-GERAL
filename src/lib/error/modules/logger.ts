import { sanitizeError, sanitizeLogData } from './sanitization';

const IS_DEV = process.env.NODE_ENV === 'development';

export const safeLog = {
    info: (message: string, data?: unknown) => {
        if (IS_DEV) {
            // eslint-disable-next-line no-console
            console.log(message, data ? sanitizeLogData(data) : '');
        }
    },
    error: (message: string, error?: unknown) => {
        if (IS_DEV) {
            console.error(message, error ? sanitizeError(error) : '');
        }
        // Prod logging placeholder
    },
    warn: (message: string, data?: unknown) => {
        if (IS_DEV) {
            console.warn(message, data ? sanitizeLogData(data) : '');
        }
    },
};
