/**
 * Hook para validação de formulário de registro
 * Extraído de src/app/registro/page.tsx
 */

import { useMemo } from 'react';

export interface RegistroFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Valida os dados do formulário de registro
 */
export function validateRegistroForm(data: RegistroFormData): ValidationResult {
  if (!data.fullName.trim()) {
    return { isValid: false, error: 'Por favor, informe seu nome completo' };
  }

  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { isValid: false, error: 'Por favor, informe um email válido' };
  }

  if (data.password.length < 6) {
    return { isValid: false, error: 'A senha deve ter no mínimo 6 caracteres' };
  }

  if (data.password !== data.confirmPassword) {
    return { isValid: false, error: 'As senhas não coincidem' };
  }

  return { isValid: true, error: null };
}

/**
 * Hook para calcular força da senha
 */
export function usePasswordStrength(password: string) {
  return useMemo(() => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Muito fraca', color: 'bg-rose-500' };
    if (password.length < 8) return { strength: 2, label: 'Fraca', color: 'bg-orange-500' };
    if (password.length < 10) return { strength: 3, label: 'Média', color: 'bg-yellow-500' };
    if (password.length < 12) return { strength: 4, label: 'Forte', color: 'bg-blue-500' };
    return { strength: 5, label: 'Muito forte', color: 'bg-emerald-500' };
  }, [password]);
}

