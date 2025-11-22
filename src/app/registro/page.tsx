'use client';

import { useState, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRegistro } from '@/hooks/registro/useRegistro';
import { RegistroForm } from '@/components/registro/RegistroForm';
import { RegistroSuccess } from '@/components/registro/RegistroSuccess';
import { RegistroPageLayout } from '@/components/registro/RegistroPageLayout';

export default function RegistroPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { loading, error, success, handleRegister } = useRegistro();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleRegister({
      fullName,
      email,
      password,
      confirmPassword,
    });
  }, [fullName, email, password, confirmPassword, handleRegister]);

  if (success) {
    return (
      <ErrorBoundary>
        <RegistroSuccess />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <RegistroPageLayout>
        <RegistroForm
          fullName={fullName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          loading={loading}
          error={error}
          onFullNameChange={setFullName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          onToggleShowConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
          onSubmit={handleSubmit}
        />
      </RegistroPageLayout>
    </ErrorBoundary>
  );
}
