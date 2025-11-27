/**
 * Hook para gerenciar autenticação e perfil do usuário no Header
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';

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

      // Verificar se cliente Supabase está usando mock
      try {
        const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (IS_DEV) {
          safeLog.info('[Header] Verificando variáveis Supabase:', {
            hasUrl: !!runtimeUrl,
            isPlaceholder: runtimeUrl?.includes('placeholder')
          });
        }

        if (runtimeUrl?.includes('placeholder.supabase.co') && typeof (supabase as any)._recreate === 'function') {
          if (IS_DEV) {
            safeLog.warn('[Header] Cliente Supabase está usando mock, tentando recriar...');
          }
          (supabase as any)._recreate();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (clientErr) {
        if (IS_DEV) {
          safeLog.warn('[Header] Erro ao verificar cliente Supabase:', clientErr);
        }
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      // Log para debug do loop
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

        // Proteção contra loop
        if (pathname !== '/login' && pathname !== '/registro') {
          if (IS_DEV) console.log('[HeaderAuth] Redirecting to login from:', pathname);
          router.push('/login');
        } else {
          if (IS_DEV) console.log('[HeaderAuth] Already on login/register, skipping redirect');
        }
        return;
      }

      // Se estiver na página de login/registro e já estiver autenticado,
      // deixar o middleware ou a própria página lidar com o redirecionamento
      if (pathname === '/login' || pathname === '/registro') {
        setHasTriedAuth(true);
        setIsLoading(false);
        // Buscar perfil apenas para mostrar no header se necessário, mas não bloquear
      }

      setHasTriedAuth(true);

      // Buscar perfil com retry
      let profile: UserProfile | null = null;
      let profileError: any = null;

      try {
        const result = await safeRpc<UserProfile>('get_current_user_profile', {}, {
          timeout: 10000,
          validateParams: false
        });
        profile = result.data;
        profileError = result.error;
      } catch (err) {
        profileError = err;
        if (IS_DEV) safeLog.warn('Erro ao buscar perfil (primeira tentativa):', err);
      }

      // Retry uma vez após 1 segundo
      if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResult = await safeRpc<UserProfile>('get_current_user_profile', {}, {
            timeout: 10000,
            validateParams: false
          });
          profile = retryResult.data;
          profileError = retryResult.error;
        } catch (retryErr) {
          profileError = retryErr;
        }
      }

      // Verificar se é erro temporário
      if (profileError) {
        const errorCode = (profileError as any)?.code || '';
        const errorMessage = String((profileError as any)?.message || '');
        const isTemporaryError = errorCode === 'TIMEOUT' ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorCode === 'PGRST301' ||
          errorMessage.includes('placeholder.supabase.co') ||
          errorMessage.includes('ERR_NAME_NOT_RESOLVED');

        if (isTemporaryError) {
          if (IS_DEV) safeLog.warn('[Header] Erro temporário ao buscar perfil, mostrando header sem perfil:', profileError);
          setIsLoading(false);
          return;
        }

        if (IS_DEV) safeLog.error('[Header] Erro ao carregar perfil:', profileError);
        setIsLoading(false);
        return;
      }

      // Verificar se usuário está aprovado
      if (!profile?.is_approved) {
        if (IS_DEV) safeLog.warn('[Header] Usuário não aprovado');
        setIsLoading(false);
        supabase.auth.signOut().catch(() => { });
        return;
      }

      // Tudo OK - definir usuário
      setUser(profile);

      // Sincronizar organization_id para user_metadata (não bloqueante)
      try {
        await syncOrganizationIdToMetadata();
      } catch (err) {
        // Não bloquear se sincronização falhar
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
    // Timeout crítico: após 3 segundos, mostrar header mesmo sem usuário
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

