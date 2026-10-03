'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardDataStatusProps {
  hasPreviousData: boolean;
  onRetry: () => void;
}

export function DashboardDataStatus({ hasPreviousData, onRetry }: DashboardDataStatusProps) {
  const styles = hasPreviousData
    ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
    : 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100';

  return (
    <div role="alert" className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${styles}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">
            {hasPreviousData ? 'Não foi possível atualizar o resumo.' : 'Não foi possível carregar o resumo.'}
          </p>
          <p className="mt-1 text-sm opacity-90">
            {hasPreviousData
              ? 'A última resposta válida continua visível.'
              : 'Os indicadores não serão exibidos como zero enquanto os dados não forem carregados.'}
          </p>
        </div>
      </div>
      <Button type="button" onClick={onRetry} variant="outline" className="shrink-0 gap-2 bg-white dark:bg-slate-950">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Tentar novamente
      </Button>
    </div>
  );
}
