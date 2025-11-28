/**
 * Hook para verificação de autenticação e autorização
 * Centraliza lógica de verificação de sessão, aprovação e permissões
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { signOutAndRedirect } from '@/utils/authHelpers';
import { CurrentUser } from '@/types';
import { checkSession } from './auth/session';
import { fetchAndValidateProfile } from './auth/profile';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Opções para o hook de autenticação
 */
export interface AuthGuardOptions {
  /** Se deve verificar se o usuário está aprovado */
  requireApproval?: boolean;
  /** Role mínimo requerido */
  requiredRole?: 'admin' | 'marketing' | 'user';
  /** Se deve buscar perfil completo do usuário */
  fetchUserProfile?: boolean;
  /** Callback quando autenticação falhar */
  onAuthFailure?: () => void;
}

/**
 * Retorno do hook useAuthGuard
 */
export interface AuthGuardResult {
  /** Se está verificando autenticação */
  isChecking: boolean;
  /** Se está autenticado */
  isAuthenticated: boolean;
  /** Usuário atual (se fetchUserProfile=true) */
  currentUser: CurrentUser | null;
  /** Erro de autenticação */
  error: string | null;
}

/**
 * Hook para gerenciar autenticação e autorização
 * 
 * Verifica:
 * - Sessão válida
 * - Token válido
 * - Usuário aprovado (opcional)
 * - Role do usuário (opcional)
 * 
 * Redireciona automaticamente para login se não autenticado
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const {
    requireApproval = true,
    requiredRole,
    fetchUserProfile = false,
    onAuthFailure
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('🔵 [useAuthGuard] Iniciando verificação de autenticação', { pathname });

        // CRÍTICO: Não executar AuthGuard nas páginas de login/registro
        if (pathname === '/login' || pathname === '/registro') {
          console.log('⚠️ [useAuthGuard] Página de login/registro detectada, pulando verificação');
          setIsChecking(false);
          setIsAuthenticated(false);
          return;
        }

        setIsChecking(true);
        setError(null);

        const sessionUser = await checkSession(router);
        if (!sessionUser) {
          if (onAuthFailure) onAuthFailure();
          return;
        }

        // Verificar aprovação e permissões se necessário
        if (requireApproval || requiredRole || fetchUserProfile) {
          const profile = await fetchAndValidateProfile(router, requireApproval, requiredRole, fetchUserProfile);

          if (profile) {
            setCurrentUser(profile);
          } else if (fetchUserProfile) {
            // Se precisava do perfil e retornou null (e não redirecionou dentro de fetchAndValidateProfile), algo deu errado
            // Mas fetchAndValidateProfile já lida com redirecionamento em caso de erro/falta de permissão
            // Se retornou null, é pq falhou.
            if (onAuthFailure) onAuthFailure();
            return;
          }

          // Usuário autenticado e autorizado
          console.log('✅ [useAuthGuard] Autenticação completa! Usuário autorizado.');
          setIsAuthenticated(true);
        } else {
          // Apenas verificação de sessão, sem verificação de perfil
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Erro inesperado - fazer logout e redirecionar
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
  }, [router, pathname, requireApproval, requiredRole, fetchUserProfile, onAuthFailure]);

  return {
    isChecking,
    isAuthenticated,
    currentUser,
    error,
  };
}
