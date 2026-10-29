'use client';

import React from 'react';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValoresCidadeFeedbackProps {
  loading: boolean;
  error: string | null;
}

export const ValoresCidadeFeedback: React.FC<ValoresCidadeFeedbackProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <div role="status" className="flex min-h-[18rem] items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>Carregando valores por cidade…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex min-h-[18rem] items-center justify-center rounded-xl border border-rose-200/80 bg-white/90 px-5 py-8 text-center dark:border-rose-900/50 dark:bg-slate-950/70">
        <div className="max-w-md">
          <AlertCircle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Não foi possível carregar os valores</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{error}</p>
          <Button type="button" variant="outline" onClick={() => window.location.reload()} className="mt-5">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
