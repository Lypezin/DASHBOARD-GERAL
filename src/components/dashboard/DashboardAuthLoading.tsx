import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const DashboardAuthLoading = React.memo(function DashboardAuthLoading() {
  return (
    <div className="folhas-world flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldCheck className="relative h-8 w-8" />
        </div>
        <div className="mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
        <p className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {'Verificando autentica\u00e7\u00e3o'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {'Validando sua sess\u00e3o e preparando o acesso ao dashboard.'}
        </p>
      </div>
    </div>
  );
});

DashboardAuthLoading.displayName = 'DashboardAuthLoading';
