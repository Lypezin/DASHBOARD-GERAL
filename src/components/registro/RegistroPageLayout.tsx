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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 selection:bg-blue-500/30">
      {/* Background Context */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Criar Conta
          </h1>
          <p className="mt-2 text-sm text-slate-400">Comece a gerenciar suas operações hoje</p>
        </div>

        {/* Card */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-30 blur transition duration-500 group-hover:opacity-50"></div>
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950/50 p-8 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
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

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
});

RegistroPageLayout.displayName = 'RegistroPageLayout';

