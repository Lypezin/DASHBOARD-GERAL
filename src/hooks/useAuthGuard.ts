/**
 * Hook para verificação de autenticação e autorização
 * Centraliza lógica de verificação de sessão, aprovação e permissões
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { clearSupabaseStorage, hasOldSupabaseTokens, signOutAndRedirect } from '@/utils/authHelpers';
import { CurrentUser } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

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
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setIsChecking(true);
        setError(null);

        // PRIMEIRO: Limpar qualquer sessão inválida do localStorage antes de verificar
        if (hasOldSupabaseTokens()) {
          const { data: { session: testSession } } = await supabase.auth.getSession();
          if (!testSession || !testSession.user) {
            // Sessão inválida - limpar tudo
            if (IS_DEV) {
              safeLog.warn('[useAuthGuard] Limpando sessões inválidas do localStorage');
            }
            clearSupabaseStorage();
          }
        }
        
        // Verificar sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !session.user) {
          // Sem sessão válida - limpar e redirecionar
          if (IS_DEV) {
            safeLog.warn('[useAuthGuard] Sem sessão válida, limpando e redirecionando para login');
          }
          await signOutAndRedirect(router);
          if (onAuthFailure) onAuthFailure();
          return;
        }
        
        // Verificar se o token da sessão ainda é válido
        try {
          const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser();
          if (verifyError || !verifiedUser) {
            // Token inválido - limpar e redirecionar
            if (IS_DEV) {
              safeLog.warn('[useAuthGuard] Token inválido, limpando e redirecionando para login');
            }
            await signOutAndRedirect(router);
            if (onAuthFailure) onAuthFailure();
            return;
          }
        } catch (verifyErr) {
          // Erro ao verificar token - limpar e redirecionar
          if (IS_DEV) {
            safeLog.warn('[useAuthGuard] Erro ao verificar token, limpando e redirecionando para login:', verifyErr);
          }
          await signOutAndRedirect(router);
          if (onAuthFailure) onAuthFailure();
          return;
        }

        // Verificar aprovação e permissões se necessário
        if (requireApproval || requiredRole || fetchUserProfile) {
          try {
            const { data: profile, error: profileError } = await safeRpc<{
              is_approved: boolean;
              is_admin: boolean;
              assigned_pracas: string[];
              role?: 'admin' | 'marketing' | 'user';
              organization_id?: string | null;
            }>('get_current_user_profile', {}, {
              timeout: RPC_TIMEOUTS.FAST,
              validateParams: false
            });

            if (profileError) {
              // Erro ao buscar perfil - fazer logout e redirecionar
              if (IS_DEV) {
                safeLog.warn('[useAuthGuard] Erro ao buscar perfil, fazendo logout:', profileError);
              }
              await signOutAndRedirect(router);
              if (onAuthFailure) onAuthFailure();
              return;
            }

            // Verificar aprovação
            if (requireApproval && !profile?.is_approved) {
              if (IS_DEV) {
                safeLog.warn('[useAuthGuard] Usuário não aprovado, fazendo logout');
              }
              await signOutAndRedirect(router);
              if (onAuthFailure) onAuthFailure();
              return;
            }

            // Verificar role
            if (requiredRole && profile?.role) {
              const roleHierarchy: Record<string, number> = {
                'user': 1,
                'marketing': 2,
                'admin': 3,
              };
              
              const userRoleLevel = roleHierarchy[profile.role] || 0;
              const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
              
              if (userRoleLevel < requiredRoleLevel) {
                if (IS_DEV) {
                  safeLog.warn(`[useAuthGuard] Usuário não tem role suficiente. Requerido: ${requiredRole}, Atual: ${profile.role}`);
                }
                await signOutAndRedirect(router);
                if (onAuthFailure) onAuthFailure();
                return;
              }
            }

            // Se fetchUserProfile, armazenar perfil
            if (fetchUserProfile && profile) {
              setCurrentUser({
                is_admin: profile.is_admin || false,
                assigned_pracas: profile.assigned_pracas || [],
                role: profile.role || 'user',
                organization_id: profile.organization_id || null,
              });
            }

            // Usuário autenticado e autorizado
            setIsAuthenticated(true);
          } catch (err) {
            // Erro ao verificar perfil - fazer logout e redirecionar
            if (IS_DEV) {
              safeLog.error('[useAuthGuard] Erro ao verificar perfil:', err);
            }
            await signOutAndRedirect(router);
            if (onAuthFailure) onAuthFailure();
            return;
          }
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
  }, [router, requireApproval, requiredRole, fetchUserProfile, onAuthFailure]);

  return {
    isChecking,
    isAuthenticated,
    currentUser,
    error,
  };
}

