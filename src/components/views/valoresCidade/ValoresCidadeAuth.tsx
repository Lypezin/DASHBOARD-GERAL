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
      <div role="status" className="flex min-h-[18rem] items-center justify-center rounded-xl border border-[#d8e4eb] bg-white dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-300" aria-hidden="true" />
          <span>Validando acesso…</span>
        </div>
      </div>
    );
  }

  return (
      <div className="flex min-h-[18rem] items-center justify-center rounded-xl border border-[#d8e4eb] bg-white px-5 py-10 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900">
            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-300" />
          </div>
          <h2 className="mb-2 text-base font-semibold text-[#183f58] dark:text-slate-100">
            Acesso Restrito
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Esta visualização agora usa as permissões reais do seu perfil.
          </p>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {errorMessage || 'Você não possui permissão para acessar Valores por Cidade.'}
          </p>
          <Button type="button" variant="outline" className="w-full border-[#b7ccd9] text-[#174d70] hover:bg-sky-50 hover:text-[#123d58] dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-900" onClick={() => window.location.reload()}>
            Atualizar permissão
          </Button>
        </div>
      </div>
    </div>
  );
};
