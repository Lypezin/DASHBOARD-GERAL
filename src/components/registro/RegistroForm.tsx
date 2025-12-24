
/**
 * Componente de formulário de registro
 * Extraído de src/app/registro/page.tsx
 */

import React, { useCallback } from 'react';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { RegistroFormInputs } from './components/RegistroFormInputs';
import { RegistroFormHeader } from './components/RegistroFormHeader';
import { RegistroFormFooter } from './components/RegistroFormFooter';

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

  const handleFullNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFullNameChange(e.target.value);
  }, [onFullNameChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  }, [onEmailChange]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(e.target.value);
  }, [onPasswordChange]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfirmPasswordChange(e.target.value);
  }, [onConfirmPasswordChange]);

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
          onFullNameChange={handleFullNameChange}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          onToggleShowPassword={onToggleShowPassword}
          onToggleShowConfirmPassword={onToggleShowConfirmPassword}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            <>
              Criar Conta
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <RegistroFormFooter />
    </>
  );
});

RegistroForm.displayName = 'RegistroForm';
