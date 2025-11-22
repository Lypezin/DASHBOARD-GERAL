/**
 * Componente de formulário de registro
 * Extraído de src/app/registro/page.tsx
 */

import React, { useCallback } from 'react';
import Link from 'next/link';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';

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
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-white">Criar Conta</h2>
        <p className="text-sm font-medium text-slate-400">Preencha os dados para começar</p>
      </div>

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

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Full Name Field */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-300">
            Nome Completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="João da Silva"
            disabled={loading}
          />
        </div>

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
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-white"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <PasswordStrengthIndicator
            password={password}
            strength={passwordStrength.strength}
            label={passwordStrength.label}
            color={passwordStrength.color}
          />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300">
            Confirmar Senha
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onToggleShowConfirmPassword}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-white"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs font-medium text-rose-400">As senhas não coincidem</p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="text-xs font-medium text-emerald-400">✓ Senhas coincidem</p>
          )}
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
                <span>Criando conta...</span>
              </>
            ) : (
              <>
                <span>Criar Conta</span>
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

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Já tem uma conta?{' '}
          <Link 
            href="/login" 
            className="font-bold text-blue-400 transition-all hover:text-blue-300 hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </>
  );
});

RegistroForm.displayName = 'RegistroForm';

