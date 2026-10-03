import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { fetchUserProfile, logLoginActivity } from './utils/loginHelpers';
import { IS_DEV } from '@/constants/environment';


export interface LoginFormData {
  email: string;
  password: string;
}

function getProfileErrorMessage(error: unknown) {
  if (typeof error === 'string') return error.trim();
  if (error === null || error === undefined) return '';

  const value = error as { message?: unknown; error?: unknown; code?: unknown };
  for (const candidate of [value.message, value.error, value.code]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }

  const rendered = String(error).trim();
  if (rendered && rendered !== '[object Object]') return rendered;

  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== '{}' ? serialized : '';
  } catch {
    return '';
  }
}

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileValidationPending, setProfileValidationPending] = useState(false);

  const finishLoginAfterProfileValidation = useCallback(async (accessToken?: string, authenticatedUserId?: string) => {
    const { profile, profileError } = await fetchUserProfile(accessToken, authenticatedUserId);

    if (profileError || !profile) {
      const profileErrorMessage = getProfileErrorMessage(profileError);
      if (IS_DEV && profileError) {
        safeLog.warn('Não foi possível validar o perfil após autenticar.', profileError);
      }
      setError(profileErrorMessage || 'Não foi possível validar seu perfil agora. Tente novamente em alguns segundos.');
      setProfileValidationPending(true);
      return false;
    }

    setProfileValidationPending(false);

    if (profile.is_approved !== true) {
      await supabase.auth.signOut();
      setError('Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.');
      return false;
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
    return true;
  }, [router]);

  const handleLogin = useCallback(async (formData: LoginFormData) => {
    setLoading(true);
    setError(null);
    setProfileValidationPending(false);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!signInData.session) {
        throw new Error('A autenticação não retornou uma sessão válida. Tente entrar novamente.');
      }

      await finishLoginAfterProfileValidation(signInData.session.access_token, signInData.user?.id);
    } catch (err: unknown) {
      safeLog.error('Erro no login:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }, [finishLoginAfterProfileValidation]);

  const retryProfileValidation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setProfileValidationPending(false);
        setError('Sua sessão expirou. Entre novamente para continuar.');
        return;
      }

      await finishLoginAfterProfileValidation(session.access_token, session.user.id);
    } catch (err: unknown) {
      safeLog.error('Erro ao tentar validar o perfil novamente:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível validar seu perfil agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [finishLoginAfterProfileValidation]);

  return {
    loading,
    error,
    profileValidationPending,
    handleLogin,
    retryProfileValidation,
  };
}
