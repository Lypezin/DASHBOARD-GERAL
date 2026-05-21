
/**
 * Utility to identify if the current user is in a password recovery flow
 * based on the URL hash or query parameters.
 */
export function isPasswordRecoveryFlow(): boolean {
    if (typeof window === 'undefined') return false;

    const searchParams = new URLSearchParams(window.location.search);

    // Checks for Supabase specific recovery markers in both hash (implicit) and query (PKCE)
    const hasRecoveryHash = window.location.hash.includes('type=recovery');
    const hasRecoveryQuery = window.location.search.includes('type=recovery');
    const hasRecoveryCode = window.location.pathname === '/redefinir-senha' && searchParams.has('code');
    const hasRecoveryError = window.location.pathname === '/redefinir-senha' && searchParams.has('error');

    return hasRecoveryHash || hasRecoveryQuery || hasRecoveryCode || hasRecoveryError;
}

/**
 * Ensures the user is redirected to the reset password page if they are in a recovery flow.
 * @param router Next.js router instance
 * @returns boolean indicating if a redirect was triggered
 */
export function ensureRecoveryRedirect(router: any): boolean {
    if (isPasswordRecoveryFlow()) {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (pathname !== '/redefinir-senha') {
            const search = window.location.search || '';
            const hash = window.location.hash || '';
            router.push(`/redefinir-senha${search}${hash}`);
            return true;
        }
    }
    return false;
}
