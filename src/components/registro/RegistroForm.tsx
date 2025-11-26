/**
 * Componente de formulário de registro
 * Extraído de src/app/registro/page.tsx
 */

import React, { useCallback } from 'react';
import Link from 'next/link';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Criar Conta</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Preencha os dados para começar</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              required
              className="pl-9"
              placeholder="João da Silva"
              disabled={loading}
            />
          </div>
        </div>

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
              minLength={6}
              className="pl-9 pr-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              minLength={6}
              className="pl-9 pr-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onToggleShowConfirmPassword}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs font-medium text-rose-500 dark:text-rose-400">As senhas não coincidem</p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Senhas coincidem</p>
          )}
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

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </>
  );
});

RegistroForm.displayName = 'RegistroForm';

