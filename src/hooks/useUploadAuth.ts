/**
 * Hook customizado para verificar autenticação e permissões de admin na página de upload
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface UserProfile {
  is_admin: boolean;
  is_approved: boolean;
}

const AUTH_TIMEOUT = 10000; // 10 segundos

/**
 * Hook para verificar se o usuário está autenticado e é admin
 * @returns Objeto com loading, isAuthorized e user
 */
export function useUploadAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    isMountedRef.current = true;
    retryCountRef.current = 0;

    const checkAuth = async () => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Timeout de segurança
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          safeLog.error('Timeout na verificação de autenticação');
          setLoading(false);
          setIsAuthorized(false);
          // Tentar recarregar se ainda não excedeu o limite de tentativas
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            setTimeout(() => {
              if (isMountedRef.current) {
                window.location.reload();
              }
            }, 1000);
          }
        }
      }, AUTH_TIMEOUT);

      try {
        // Verificar se o usuário está autenticado
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (!isMountedRef.current) return;

        if (authError || !authUser) {
          safeLog.error('Erro ao obter usuário:', authError);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          router.push('/login');
          return;
        }

        setUser(authUser);

        // Verificar se é admin com timeout
        const profilePromise = supabase
          .rpc('get_current_user_profile') as Promise<{ data: UserProfile | null; error: any }>;
        
        const profileResult = await Promise.race([
          profilePromise,
          new Promise<{ data: null; error: { message: string } }>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout na verificação de perfil')), 8000)
          )
        ]).catch((err) => {
          safeLog.error('Erro ou timeout na verificação de perfil:', err);
          return { data: null, error: { message: err.message || 'Timeout' } };
        });

        if (!isMountedRef.current) return;

        const { data: profile, error } = profileResult;

        if (error) {
          safeLog.error('Erro ao verificar perfil do usuário:', error);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setLoading(false);
          setIsAuthorized(false);
          // Tentar novamente se ainda não excedeu o limite
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            setTimeout(() => {
              if (isMountedRef.current) {
                window.location.reload();
              }
            }, 2000);
          }
          return;
        }

        if (!profile?.is_admin) {
          // Usuário não é admin - redirecionar para página principal
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          router.push('/');
          return;
        }

        // Verificar se está aprovado
        if (!profile?.is_approved) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          router.push('/login');
          return;
        }

        // Usuário autorizado
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsAuthorized(true);
      } catch (err) {
        safeLog.error('Erro ao verificar autenticação:', err);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (isMountedRef.current) {
          setLoading(false);
          setIsAuthorized(false);
          // Tentar recarregar a página após 2 segundos em caso de erro
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            setTimeout(() => {
              if (isMountedRef.current) {
                window.location.reload();
              }
            }, 2000);
          }
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  return { loading, isAuthorized, user };
}

