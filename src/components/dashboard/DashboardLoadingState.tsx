/**
 * Componente para estados de loading do dashboard
 * Extraído de src/app/page.tsx
 */

import React from 'react';

interface DashboardLoadingStateProps {
  message?: string;
}

export const DashboardLoadingState = React.memo(function DashboardLoadingState({
  message = 'Carregando dashboard...',
}: DashboardLoadingStateProps) {
  return (
    <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-3 sm:border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
        <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">{message}</p>
      </div>
    </div>
  );
});

DashboardLoadingState.displayName = 'DashboardLoadingState';

