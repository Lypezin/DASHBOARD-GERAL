/**
 * Componente de formulário de registro
 * Extraído de src/app/registro/page.tsx
 */

import React from 'react';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { RegistroFormInputs } from './components/RegistroFormInputs';
import { RegistroFormHeader } from './components/RegistroFormHeader';
import { RegistroFormFooter } from './components/RegistroFormFooter';
import { RegistroSubmitButton } from './components/RegistroSubmitButton';

interface RegistroFormProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  error: string | null;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegistroForm = React.memo(function RegistroForm({
  fullName,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  loading,
  error,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onSubmit,
}: RegistroFormProps) {
  const passwordStrength = usePasswordStrength(password);

  return (
    <>
      <RegistroFormHeader />

      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <RegistroFormInputs
          fullName={fullName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          loading={loading}
          passwordStrength={passwordStrength}
          onFullNameChange={(e) => onFullNameChange(e.target.value)}
          onEmailChange={(e) => onEmailChange(e.target.value)}
          onPasswordChange={(e) => onPasswordChange(e.target.value)}
          onConfirmPasswordChange={(e) => onConfirmPasswordChange(e.target.value)}
          onToggleShowPassword={onToggleShowPassword}
          onToggleShowConfirmPassword={onToggleShowConfirmPassword}
        />

        <RegistroSubmitButton loading={loading} />
      </form>

      <RegistroFormFooter />
    </>
  );
});

RegistroForm.displayName = 'RegistroForm';
