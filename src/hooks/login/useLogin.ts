/**
 * Hook para gerenciar lógica de login
 * Extraído de src/app/login/page.tsx
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { syncOrganizationIdToMetadata } from '@/utils/organizationHelpers';
import { fetchUserProfile, logLoginActivity } from './utils/loginHelpers';

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
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      // Verificar se o usuário está aprovado com retry
      const { profile, profileError } = await fetchUserProfile();

      if (profileError) {
        const errorCode = (profileError as any)?.code || '';
        const errorMessage = String((profileError as any)?.message || '');
        const isTemporaryError = errorCode === 'TIMEOUT' ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network');

        if (isTemporaryError) {
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
        if (IS_DEV) {
          safeLog.warn('Erro ao sincronizar organization_id (não bloqueante):', err);
        }
      }

      // Registrar atividade de login
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await logLoginActivity(user.id);
        }
      } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao registrar atividade de login:', err);
      }

      // Login bem-sucedido
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      safeLog.error('Erro no login:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.');
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
