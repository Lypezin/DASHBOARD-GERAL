'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSessionCleanup } from '@/hooks/login/useSessionCleanup';
import { useLogin } from '@/hooks/login/useLogin';
import { LoginForm } from '@/components/login/LoginForm';
import { LoginPageLayout } from '@/components/login/LoginPageLayout';

export default function LoginPage() {
  // Limpar sessões inválidas ao carregar
  useSessionCleanup();

  const { loading, error, handleLogin } = useLogin();

  return (
    <ErrorBoundary>
      <LoginPageLayout>
        <LoginForm
          loading={loading}
          error={error}
          onSubmit={handleLogin}
        />
      </LoginPageLayout>
    </ErrorBoundary>
  );
}
