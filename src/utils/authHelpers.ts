/**
 * Funções utilitárias para autenticação
 * Centraliza lógica de limpeza de storage e verificação de sessão
 */

import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Limpa todas as chaves do localStorage relacionadas ao Supabase
 */
export function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Também remover chave específica se existir
  localStorage.removeItem('supabase.auth.token');
  
  if (IS_DEV) {
    safeLog.info('[clearSupabaseStorage] Limpou chaves do localStorage:', keysToRemove.length);
  }
}

/**
 * Verifica se há tokens antigos no localStorage
 */
export function hasOldSupabaseTokens(): boolean {
  if (typeof window === 'undefined') return false;
  
  return Array.from({ length: localStorage.length }, (_, i) => {
    const key = localStorage.key(i);
    return key && (key.startsWith('sb-') || key.includes('supabase'));
  }).some(Boolean);
}

/**
 * Limpa sessão e storage, redirecionando para login
 */
export async function signOutAndRedirect(router: { push: (path: string) => void }, redirectPath: string = '/login'): Promise<void> {
  try {
    await supabase.auth.signOut();
    clearSupabaseStorage();
    router.push(redirectPath);
  } catch (error) {
    if (IS_DEV) {
      safeLog.error('[signOutAndRedirect] Erro ao fazer logout:', error);
    }
    clearSupabaseStorage();
    router.push(redirectPath);
  }
}

