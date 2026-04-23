/**
 * Hook para gerenciar autenticacao e perfil do usuario no Header
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
          if (IS_DEV) safeLog.info('[HeaderAuth] Redirect to login from:', pathname);
          router.push(`/login${typeof window !== 'undefined' ? window.location.search : ''}`);
        } else if (IS_DEV) {
          safeLog.info('[HeaderAuth] Public page or skip redirect');
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

      const profile = profileResult.profile!;
      setUser(profile);

      const profileOrganizationId = profile.organization_id;
      const authOrganizationId = sessionResult.user?.user_metadata?.organization_id;

      // Avoid an extra profile/auth write path on every header mount.
      if (profileOrganizationId && profileOrganizationId !== authOrganizationId) {
        try {
          await syncOrganizationIdToMetadata();
        } catch (err) {
          if (IS_DEV) safeLog.warn('[Header] Erro ao sincronizar organization_id (nao bloqueante):', err);
        }
      }
    } catch (err) {
      if (IS_DEV) safeLog.error('[Header] Erro inesperado ao verificar usuario:', err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [pathname, router]);

  useAuthSubscription({ checkUser, setUser, pathname });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (IS_DEV) safeLog.warn('[Header] Timeout atingido (3s), exibindo header publicamente');
      setIsLoading(false);
    }, 3000);
    loadingTimeoutRef.current = timeoutId;
    checkUser();
    return () => {
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
    };
  }, [checkUser]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
