/**
 * Hook para gerenciar autenticação e perfil do usuário no Header
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';
import { checkSupabaseMock, fetchUserProfileWithRetry, isTemporaryError } from '@/utils/auth/headerAuthHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  organization_id?: string | null;
}

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

      // 1. Verificar Mock
      await checkSupabaseMock();

      // 2. Verificar Sessão Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (IS_DEV) {
        console.log('[HeaderAuth] Check:', {
          pathname,
          hasUser: !!authUser,
          error: authError?.message
        });
      }

      if (authError || !authUser) {
        setHasTriedAuth(true);
        setIsLoading(false);

        if (pathname !== '/login' && pathname !== '/registro') {
          if (IS_DEV) console.log('[HeaderAuth] Redirecting to login from:', pathname);
          router.push('/login');
        } else {
          if (IS_DEV) console.log('[HeaderAuth] Already on login/register, skipping redirect');
        }
        return;
      }

      if (pathname === '/login' || pathname === '/registro') {
        setHasTriedAuth(true);
        setIsLoading(false);
      }

      setHasTriedAuth(true);

      // 3. Buscar Perfil (agora com lógica extraída)
      const { profile, error: profileError } = await fetchUserProfileWithRetry();

      // 4. Tratar Erros de Perfil
      if (profileError) {
        if (isTemporaryError(profileError)) {
          if (IS_DEV) safeLog.warn('[Header] Erro temporário ao buscar perfil, mostrando header sem perfil:', profileError);
          setIsLoading(false);
          return;
        }

        if (IS_DEV) safeLog.error('[Header] Erro ao carregar perfil:', profileError);
        setIsLoading(false);
        return;
      }

      // 5. Verificar Aprovação
      if (!profile?.is_approved) {
        if (IS_DEV) safeLog.warn('[Header] Usuário não aprovado');
        setIsLoading(false);
        supabase.auth.signOut().catch(() => { });
        return;
      }

      // 6. Sucesso
      setUser(profile);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (pathname !== '/login' && pathname !== '/registro') {
          router.push('/login');
        }
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (IS_DEV && event === 'USER_UPDATED') {
          safeLog.info('[Header] Evento USER_UPDATED recebido, atualizando perfil...');
        }
        checkUser();
      }
    });

    const handleProfileUpdate = (event: CustomEvent) => {
      if (IS_DEV) safeLog.info('[Header] Evento customizado userProfileUpdated recebido, atualizando perfil...', event.detail);
      checkUser();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
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

