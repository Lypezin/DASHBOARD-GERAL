/**
 * Hook para gerenciar lógica de registro
 * Extraído de src/app/registro/page.tsx
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { validateRegistroForm, type RegistroFormData } from './useRegistroValidation';

export function useRegistro() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = useCallback(async (formData: RegistroFormData) => {
    setLoading(true);
    setError(null);

    // Validar formulário
    const validation = validateRegistroForm(formData);
    if (!validation.isValid) {
      setError(validation.error || 'Erro de validação');
      setLoading(false);
      return;
    }

    try {
      // Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      
      // Redirecionar após 10 segundos
      setTimeout(() => {
        router.push('/login');
      }, 10000);
    } catch (err: any) {
      safeLog.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    loading,
    error,
    success,
    handleRegister,
  };
}

