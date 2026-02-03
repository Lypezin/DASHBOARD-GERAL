
/**
 * Hook para gerenciar autenticação e perfil do usuário no Header
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';
import { UserProfile } from './types';
import { verifyAuthSession, verifyUserProfile, shouldSkipRedirect } from './utils/headerAuthSteps';
import { useAuthSubscription } from './useAuthSubscription';

const IS_DEV = process.env.NODE_ENV === 'development';

export type { UserProfile };

export function useHeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUser = useCallback(async () => {
    try {
      setIsLoading(true);

      const sessionResult = await verifyAuthSession(pathname);

      if (!sessionResult.success) {
        setHasTriedAuth(true);
        setIsLoading(false);

        if (sessionResult.action === 'redirect_login') {
          if (IS_DEV) safeLog.info('[HeaderAuth] Redirecting to login from:', pathname);
          const search = typeof window !== 'undefined' ? window.location.search : '';
          router.push(`/login${search}`);
        } else {
          if (IS_DEV) safeLog.info('[HeaderAuth] Public page or skip redirect');
        }
        return;
      }

      if (shouldSkipRedirect(pathname)) {
        setHasTriedAuth(true);
        setIsLoading(false);
      }

      setHasTriedAuth(true);

      const profileResult = await verifyUserProfile();

      if (!profileResult.success) {
        setIsLoading(false);
        return;
      }

      setUser(profileResult.profile!);

      // 7. Sincronizar (não bloqueante)
      try {
        await syncOrganizationIdToMetadata();
      } catch (err) {
        if (IS_DEV) {
          safeLog.warn('[Header] Erro ao sincronizar organization_id (não bloqueante):', err);
        }
      }
    } catch (err) {
      if (IS_DEV) safeLog.error('[Header] Erro inesperado ao verificar usuário:', err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [pathname, router]);

  // Use extracted subscription logic
  useAuthSubscription({ checkUser, setUser, pathname });

  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        if (IS_DEV) {
          safeLog.warn('[Header] Timeout de loading atingido (3s), mostrando header mesmo sem usuário');
        }
        setIsLoading(false);
      }
    }, 3000);

    checkUser();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [checkUser]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      safeLog.error('Erro ao fazer logout:', error);
    }
  }, []);

  return {
    user,
    isLoading,
    hasTriedAuth,
    handleLogout,
  };
}
