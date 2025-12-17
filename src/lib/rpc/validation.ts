export function is500Error(error: unknown): boolean {
    const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string } : null;
    const errorCode = errorObj?.code || '';
    const errorMessage = String(errorObj?.message || '');
    return errorCode === 'PGRST301' ||
        errorMessage.includes('500') ||
        errorMessage.includes('Internal Server Error');
}

export function isRateLimitError(error: unknown): boolean {
    const errorObj = error && typeof error === 'object' ? error as { code?: string; message?: string } : null;
    const errorCode = errorObj?.code || '';
    const errorMessage = String(errorObj?.message || '');
    return errorCode === 'RATE_LIMIT_EXCEEDED' ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429');
}
