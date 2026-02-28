/** Componente de formulário de login - Extraído de src/app/login/page.tsx */

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import type { LoginFormData } from '@/hooks/login/useLogin';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { LoginHeader } from './components/LoginHeader';
import { LoginFields } from './components/LoginFields';

interface LoginFormProps { loading: boolean; error: string | null; onSubmit: (formData: LoginFormData) => void; }

export const LoginForm = React.memo(function LoginForm({ loading, error, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  }, [email, password, onSubmit]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <>
      <LoginHeader />

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <LoginFields
          email={email}
          onEmailChange={handleEmailChange}
          password={password}
          onPasswordChange={handlePasswordChange}
          showPassword={showPassword}
          onTogglePassword={toggleShowPassword}
          loading={loading}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-2 text-slate-400 font-medium">
            ou
          </span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Não tem uma conta?{' '}
          <Link
            href="/registro"
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </>
  );
});

LoginForm.displayName = 'LoginForm';
