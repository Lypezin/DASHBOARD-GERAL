'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Componente que verifica no Supabase se deve forçar logout de todos os usuários
 * Quando ativo, força logout de todos os usuários que acessarem o sistema
 * A flag deve ser desativada manualmente quando desejar parar de forçar logout
 */
export function ForceLogoutChecker() {
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Só executar no cliente
    if (typeof window === 'undefined') return;
    
    // Não executar na página de login para evitar loops
    if (window.location.pathname === '/login' || window.location.pathname === '/registro') {
      setHasChecked(true);
      return;
    }
    
    // Verificar se já foi executado nesta sessão
    const alreadyExecuted = sessionStorage.getItem('force_logout_executed');
    if (alreadyExecuted === 'true') {
      setHasChecked(true);
      return;
    }

    // Função para verificar e executar logout se necessário
    const checkAndExecuteLogout = async () => {
      try {
        // Verificar no Supabase se o logout forçado está ativo
        const { data: config, error: configError } = await supabase
          .from('force_logout_config')
          .select('is_active')
          .eq('id', 1)
          .single();

        if (configError) {
          // Se houver erro (ex: tabela não existe, sem permissão), apenas logar e continuar
          if (IS_DEV) {
            safeLog.warn('[ForceLogoutChecker] Erro ao verificar config:', configError);
          }
          setHasChecked(true);
          return;
        }

        // Se não estiver ativo, apenas marcar como verificado
        if (!config?.is_active) {
          setHasChecked(true);
          return;
        }

        // Se estiver ativo, executar logout
        if (IS_DEV) {
          safeLog.info('[ForceLogoutChecker] Flag de logout forçado detectada no Supabase, executando logout...');
        }

        // Limpar todas as sessões do Supabase
        await supabase.auth.signOut();
        
        // Limpar localStorage do Supabase
        if (typeof window !== 'undefined') {
          // Limpar a chave de autenticação do Supabase
          localStorage.removeItem('supabase.auth.token');
          
          // Limpar outros possíveis dados relacionados
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        // Marcar como executado nesta sessão
        sessionStorage.setItem('force_logout_executed', 'true');

        if (IS_DEV) {
          safeLog.info('[ForceLogoutChecker] Logout forçado executado com sucesso');
        }

        // Redirecionar para login
        router.push('/login');
        router.refresh();
      } catch (error) {
        safeLog.error('[ForceLogoutChecker] Erro ao executar logout forçado:', error);
        // Mesmo com erro, tentar limpar localStorage e redirecionar
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
        router.push('/login');
      }
    };

    // Executar verificação
    checkAndExecuteLogout();
  }, [router]);

  // Este componente não renderiza nada
  return null;
}
