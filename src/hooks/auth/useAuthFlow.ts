
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { signOutAndRedirect } from '@/utils/authHelpers';
import { checkSession } from './session';
import { fetchAndValidateProfile } from './profile';
import { AuthGuardOptions, AuthGuardResult } from './useAuthGuard';
import { CurrentUser } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAuthFlow(options: AuthGuardOptions): AuthGuardResult {
    const {
        requireApproval = true,
        requiredRole,
        fetchUserProfile = false,
        onAuthFailure,
        skip = false
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(!skip);
    const [isAuthenticated, setIsAuthenticated] = useState(skip);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (skip) return;

        const checkAuthentication = async (isBackgroundCheck = false) => {
            try {
                if (pathname === '/login' || pathname === '/registro') {
                    if (!isBackgroundCheck) setIsChecking(false);
                    setIsAuthenticated(false);
                    return;
                }

                if (!isBackgroundCheck) setIsChecking(true);
                setError(null);

                const sessionUser = await checkSession(router);
                if (!sessionUser) {
                    if (onAuthFailure) onAuthFailure();
                    return;
                }

                if (requireApproval || requiredRole || fetchUserProfile) {
                    const profile = await fetchAndValidateProfile(router, requireApproval, requiredRole, fetchUserProfile, sessionUser.id);
                    if (profile) {
                        setCurrentUser(profile);
                    } else if (fetchUserProfile) {
                        if (onAuthFailure) onAuthFailure();
                        return;
                    }
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(true);
                }
            } catch (err) {
                if (IS_DEV) {
                    safeLog.error('[useAuthGuard] Erro ao verificar autenticação:', err);
                }
                setError(err instanceof Error ? err.message : 'Erro ao verificar autenticação');
                await signOutAndRedirect(router);
                if (onAuthFailure) onAuthFailure();
            } finally {
                setIsChecking(false);
            }
        };

        checkAuthentication();

        // Expor a função para o caso da inscrição do evento do supabase 
        // usar em verificações futuras (background sync)
        if (typeof window !== 'undefined') {
            (window as any).__performBackgroundAuthCheck = () => checkAuthentication(true);
        }
    }, [router, pathname, requireApproval, requiredRole, fetchUserProfile, onAuthFailure, skip]);

    return {
        isChecking,
        isAuthenticated,
        currentUser,
        error,
    };
}
