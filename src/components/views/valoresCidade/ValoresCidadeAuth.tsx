import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface ValoresCidadeAuthProps {
  loading: boolean;
  errorMessage: string | null;
}

export const ValoresCidadeAuth: React.FC<ValoresCidadeAuthProps> = ({
  loading,
  errorMessage,
}) => {
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-200">Validando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-md rounded-xl border border-amber-200 bg-white p-8 shadow-xl dark:border-amber-900 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Acesso Restrito
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Esta visualização agora usa as permissões reais do seu perfil.
          </p>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {errorMessage || 'Você não possui permissão para acessar Valores por Cidade.'}
          </p>
          <Button type="button" className="w-full" onClick={() => window.location.reload()}>
            Atualizar permissão
          </Button>
        </div>
      </div>
    </div>
  );
};
