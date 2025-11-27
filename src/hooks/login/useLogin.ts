/**
 * Hook para gerenciar lógica de login
 * Extraído de src/app/login/page.tsx
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface LoginFormData {
  email: string;
  password: string;
}

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (formData: LoginFormData) => {
    console.log('🔵 [useLogin] Iniciando processo de login...');
    setLoading(true);
    setError(null);

    try {
      console.log('🔵 [useLogin] Chamando signInWithPassword...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.log('🔴 [useLogin] Erro no signInWithPassword:', signInError.message);
        throw signInError;
      }

      console.log('✅ [useLogin] signInWithPassword bem-sucedido');

      // Verificar se o usuário está aprovado com retry
      let profile: any = null;
      let profileError: any = null;

      try {
        const result = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
        profile = result.data;
        profileError = result.error;
      } catch (err) {
        profileError = err;
      }

      // Se houver erro, tentar novamente uma vez
      if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResult = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
          profile = retryResult.data;
          profileError = retryResult.error;
        } catch (retryErr) {
          profileError = retryErr;
        }
      }

      if (profileError) {
        // Erro ao carregar perfil - fazer logout apenas se for erro permanente
        const errorCode = (profileError as any)?.code || '';
        const errorMessage = String((profileError as any)?.message || '');
        const isTemporaryError = errorCode === 'TIMEOUT' ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network');

        if (isTemporaryError) {
          // Erro temporário - tentar continuar
          if (IS_DEV) safeLog.warn('Erro temporário ao carregar perfil no login, continuando...');
        } else {
          await supabase.auth.signOut();
          throw new Error('Erro ao carregar perfil do usuário. Tente novamente.');
        }
      }

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        setError('Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.');
        setLoading(false);
        return;
      }

      // Sincronizar organization_id para user_metadata
      try {
        await syncOrganizationIdToMetadata();
      } catch (err) {
        // Não bloquear login se sincronização falhar
        if (IS_DEV) {
          safeLog.warn('Erro ao sincronizar organization_id (não bloqueante):', err);
        }
      }

      // Registrar atividade de login (tentar, mas não bloquear se falhar)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { error: rpcError } = await supabase.rpc('registrar_atividade', {
            p_session_id: user.id,
            p_action_type: 'login',
            p_action_details: 'Fez login no sistema',
            p_tab_name: 'dashboard',
            p_filters_applied: null // Passar null em vez de {} vazio
          });

          // Ignorar erro silenciosamente - não bloquear login
          // Apenas logar em desenvolvimento se não for 404
          if (rpcError) {
            const errorCode = (rpcError as any)?.code || '';
            const errorMessage = String((rpcError as any)?.message || '');
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' ||
              errorCode === 'PGRST204' ||
              errorMessage.includes('404') ||
              errorMessage.includes('not found');

            if (!is404 && IS_DEV) {
              safeLog.warn('Erro ao registrar atividade de login (não bloqueante):', rpcError);
            }
          }
        }
      } catch (err) {
        // Ignorar erro - não bloquear login
        if (IS_DEV) safeLog.warn('Erro ao registrar atividade de login:', err);
      }

      // Login bem-sucedido
      console.log('✅ [useLogin] Login completo, redirecionando para /');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      safeLog.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    loading,
    error,
    handleLogin,
  };
}

