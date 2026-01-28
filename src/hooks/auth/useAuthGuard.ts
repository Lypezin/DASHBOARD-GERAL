
/**
 * Hook para verificação de autenticação e autorização
 * Centraliza lógica de verificação de sessão, aprovação e permissões
 */

import { CurrentUser } from '@/types';
import { useAuthFlow } from './auth/useAuthFlow';

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
  /** Se deve pular a verificação (ex: já autenticado via session storage) */
  skip?: boolean;
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
  return useAuthFlow(options);
}
