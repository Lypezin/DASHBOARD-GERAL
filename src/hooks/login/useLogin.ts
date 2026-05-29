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

function isRecoverableProfileError(error: unknown) {
  const errorCode = (error as any)?.code || '';
  const errorMessage = String((error as any)?.message || '');

  return errorCode === 'TIMEOUT' ||
    errorCode === 'PGRST116' ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('406');
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

      const { profile, profileError } = await fetchUserProfile();

      if (profileError) {
        if (isRecoverableProfileError(profileError)) {
          if (IS_DEV) safeLog.warn('Erro temporario ao carregar perfil no login, continuando...', profileError);
        } else {
          setError('Nao foi possivel validar seu perfil agora. Tente novamente em alguns segundos.');
          setLoading(false);
          return;
        }
      }

      if (profile && !profile.is_approved) {
        await supabase.auth.signOut();
        setError('Sua conta ainda nao foi aprovada. Aguarde a aprovacao de um administrador.');
        setLoading(false);
        return;
      }

      try {
        await syncOrganizationIdToMetadata();
      } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao sincronizar organization_id (nao bloqueante):', err);
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await logLoginActivity(user.id);
        }
      } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao registrar atividade de login:', err);
      }

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
