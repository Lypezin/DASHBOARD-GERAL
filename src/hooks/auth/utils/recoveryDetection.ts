
/**
 * Utility to identify if the current user is in a password recovery flow
 * based on the URL hash or query parameters.
 */
export function isPasswordRecoveryFlow(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Checks for Supabase specific recovery markers in both hash (implicit) and query (PKCE)
    const hasRecoveryHash = window.location.hash.includes('type=recovery');
    const hasRecoveryQuery = window.location.search.includes('type=recovery');
    
    // Also check for the presence of recovery tokens/codes if needed, 
    // but the 'type=recovery' is the standard Supabase indicator.
    return hasRecoveryHash || hasRecoveryQuery;
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
            router.push('/redefinir-senha');
            return true;
        }
    }
    return false;
}
