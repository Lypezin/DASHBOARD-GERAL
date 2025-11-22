import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface ValoresCidadeAuthProps {
  password: string;
  passwordError: string | null;
  loading: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ValoresCidadeAuth: React.FC<ValoresCidadeAuthProps> = ({
  password,
  passwordError,
  loading,
  onPasswordChange,
  onSubmit,
}) => {
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-200">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="max-w-md w-full mx-auto rounded-xl border border-purple-200 bg-white p-8 shadow-xl dark:border-purple-900 dark:bg-slate-900">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Digite a senha para acessar Valores por Cidade
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className={`w-full ${passwordError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
              autoFocus
            />
            {passwordError && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{passwordError}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
};

