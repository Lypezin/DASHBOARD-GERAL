
/**
 * Hook para gerenciar autenticação e perfil do usuário no Header
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';
import { UserProfile } from './types';
import { verifyUserProfile } from './utils/headerAuthSteps';
import { useAuthSubscription } from './useAuthSubscription';

const IS_DEV = process.env.NODE_ENV === 'development';

export type { UserProfile };

export function useHeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { sessionUser, isLoading: isSessionLoading, refreshSession } = useAuthSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUser = useCallback(async () => {
    if (isSessionLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const activeSessionUser = sessionUser ?? (await refreshSession(true)).user;

      if (!activeSessionUser) {
        setHasTriedAuth(true);
        setIsLoading(false);
        if (IS_DEV) safeLog.info('[HeaderAuth] Redirect to login from:', pathname);
        router.push(`/login${typeof window !== 'undefined' ? window.location.search : ''}`);
        return;
      }

      setHasTriedAuth(true);

      const profileResult = await verifyUserProfile();

      if (!profileResult.success) {
        setIsLoading(false);
        return;
      }

      setUser(profileResult.profile!);

      // 7. Sincronizar (não bloqueante)
      try { await syncOrganizationIdToMetadata(); }
      catch (err) { if (IS_DEV) safeLog.warn('[Header] Erro ao sincronizar organization_id (não bloqueante):', err); }
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
  }, [isSessionLoading, pathname, refreshSession, router, sessionUser]);

  // Use extracted subscription logic
  useAuthSubscription({ checkUser, setUser, pathname });

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    loadingTimeoutRef.current = setTimeout(() => {
      if (IS_DEV) safeLog.warn('[Header] Timeout atingido (3s), exibindo header publicamente');
      setIsLoading(false);
    }, 3000);
    checkUser();
    return () => { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
  }, [checkUser, isSessionLoading]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) { safeLog.error('Erro ao fazer logout:', error); }
  }, []);

  return {
    user,
    isLoading,
    hasTriedAuth,
    handleLogout,
  };
}
