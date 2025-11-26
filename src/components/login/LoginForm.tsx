/**
 * Componente de formulário de login
 * Extraído de src/app/login/page.tsx
 */

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import type { LoginFormData } from '@/hooks/login/useLogin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (formData: LoginFormData) => void;
}

export const LoginForm = React.memo(function LoginForm({
  loading,
  error,
  onSubmit,
}: LoginFormProps) {
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
      {/* Card Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Entre com suas credenciais para continuar</p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              className="pl-9"
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              required
              className="pl-9 pr-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 px-8"
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
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            ou
          </span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Não tem uma conta?{' '}
          <Link
            href="/registro"
            className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </>
  );
});

LoginForm.displayName = 'LoginForm';

