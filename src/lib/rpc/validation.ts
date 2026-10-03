export function is500Error(error: unknown): boolean {
    const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string; status?: number } : null;
    const errorCode = errorObj?.code || '';
    const errorMessage = String(errorObj?.message || '');
    return errorObj?.status === 500 ||
        errorCode === '500' ||
        errorCode === 'HTTP_500' ||
        errorCode === 'PGRST301' ||
        errorMessage.includes('500') ||
        errorMessage.includes('Internal Server Error');
}

export function isTimeoutError(error: unknown): boolean {
    const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string; status?: number } : null;
    const errorCode = errorObj?.code || '';
    const errorMessage = String(errorObj?.message || '').toLowerCase();

    return errorObj?.status === 408 ||
        errorObj?.status === 504 ||
        errorCode === 'TIMEOUT' ||
        errorCode === '57014' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('demorou muito') ||
        errorMessage.includes('statement timeout') ||
        errorMessage.includes('canceling statement due to statement timeout');
}

export function isRateLimitError(error: unknown): boolean {
    const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string; status?: number } : null;
    const errorCode = errorObj?.code || '';
    const errorMessage = String(errorObj?.message || '');
    return errorObj?.status === 429 ||
        errorCode === '429' ||
        errorCode === 'RATE_LIMIT_EXCEEDED' ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429');
}
