/**
 * Componente de formulário de login
 * Extraído de src/app/login/page.tsx
 */

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import type { LoginFormData } from '@/hooks/login/useLogin';

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
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-white">Bem-vindo de volta</h2>
        <p className="text-sm font-medium text-slate-400">Entre com suas credenciais para continuar</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 animate-scale-in rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
              <span className="text-sm">⚠️</span>
            </div>
            <p className="flex-1 text-sm font-medium text-rose-200">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="seu@email.com"
            disabled={loading}
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-white"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <div className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </>
            )}
          </div>
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <span className="text-xs font-medium text-slate-500">ou</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Não tem uma conta?{' '}
          <Link 
            href="/registro" 
            className="font-bold text-blue-400 transition-all hover:text-blue-300 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </>
  );
});

LoginForm.displayName = 'LoginForm';

