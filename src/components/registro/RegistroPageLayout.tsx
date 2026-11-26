/**
 * Layout compartilhado para página de registro
 * Extraído de src/app/registro/page.tsx
 */

import React from 'react';

interface RegistroPageLayoutProps {
  children: React.ReactNode;
}

export const RegistroPageLayout = React.memo(function RegistroPageLayout({
  children,
}: RegistroPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-screen max-w-full items-center justify-center overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 py-8 selection:bg-blue-500/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-4 sm:py-12">
      {/* Background Context */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 motion-safe:animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 motion-safe:animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 motion-safe:animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-60 dark:opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-[min(420px,calc(100vw-24px))]">
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 ring-1 ring-black/5">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300">
            Criar Conta
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Comece a gerenciar suas operações hoje</p>
        </div>

        {/* Card */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 opacity-40 blur transition duration-500 group-hover:opacity-60"></div>
          <div className="relative rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:border-slate-800/80 dark:bg-slate-900/85 sm:p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-default">
            © 2025 Dashboard System. Secure Access.
          </p>
        </div>
      </div>

      
    </div>
  );
});

RegistroPageLayout.displayName = 'RegistroPageLayout';

