/**
 * Hook para limpeza de sessões inválidas
 * Extraído de src/app/login/page.tsx
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook para verificar e limpar sessões inválidas ao carregar a página
 */
export function useSessionCleanup() {
  useEffect(() => {
    const checkAndCleanInvalidSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Se houver sessão mas não for válida (sem user), limpar
        if (session && !session.user) {
          if (IS_DEV) safeLog.info('[SessionCleanup] Invalid session detected (no user), cleaning up...');
          if (IS_DEV) safeLog.warn('[useSessionCleanup] Sessão inválida detectada, limpando...');

          await supabase.auth.signOut().catch(err => {
            if (IS_DEV) safeLog.warn('[useSessionCleanup] Erro ao fazer signOut (ignorado):', err);
          });

          if (typeof window !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            if (IS_DEV) safeLog.info('[useSessionCleanup] LocalStorage limpo');
          }
        }
      } catch (err) {
        // Ignorar erros silenciosamente
        if (IS_DEV) safeLog.warn('Erro ao verificar sessão no login:', err);
      }
    };

    checkAndCleanInvalidSession();
  }, []);
}
