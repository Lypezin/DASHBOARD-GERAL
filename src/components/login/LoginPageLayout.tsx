/**
 * Layout compartilhado para página de login
 * Extraído de src/app/login/page.tsx
 */

import React from 'react';

interface LoginPageLayoutProps {
  children: React.ReactNode;
}

export const LoginPageLayout = React.memo(function LoginPageLayout({
  children,
}: LoginPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 selection:bg-blue-500/30">
      {/* Background Context */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 ring-1 ring-black/5">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Entre para gerenciar suas operações</p>
        </div>

        {/* Login Card */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 opacity-40 blur transition duration-500 group-hover:opacity-60"></div>
          <div className="relative rounded-2xl border border-white/60 bg-white/70 p-8 backdrop-blur-xl shadow-2xl ring-1 ring-black/5">
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

LoginPageLayout.displayName = 'LoginPageLayout';

