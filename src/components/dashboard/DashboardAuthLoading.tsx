/**
 * Componente para loading de autenticação
 * Extraído de src/app/page.tsx
 */

import React from 'react';

export const DashboardAuthLoading = React.memo(function DashboardAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Verificando autenticação...</p>
      </div>
    </div>
  );
});

DashboardAuthLoading.displayName = 'DashboardAuthLoading';

