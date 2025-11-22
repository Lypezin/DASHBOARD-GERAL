/**
 * Componente para estados de erro do dashboard
 * Extraído de src/app/page.tsx
 */

import React from 'react';

interface DashboardErrorStateProps {
  error: string;
}

export const DashboardErrorState = React.memo(function DashboardErrorState({
  error,
}: DashboardErrorStateProps) {
  return (
    <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center animate-fade-in">
      <div className="max-w-sm sm:max-w-md mx-auto rounded-xl sm:rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
        <div className="text-4xl sm:text-5xl">⚠️</div>
        <p className="mt-4 text-lg sm:text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
        <p className="mt-2 text-sm sm:text-base text-rose-700 dark:text-rose-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
});

DashboardErrorState.displayName = 'DashboardErrorState';

