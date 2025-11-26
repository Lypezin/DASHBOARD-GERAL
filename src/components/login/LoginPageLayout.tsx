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
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 px-4 py-12">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: '2s' }}></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:scale-110 hover:rotate-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <span className="text-4xl">📊</span>
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            Dashboard
          </h1>
          <p className="text-lg font-semibold text-blue-200/90">Sistema de Análise Operacional</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-400">Sistema Online</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="group relative">
          {/* Card Glow */}
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-20 blur-xl transition-opacity group-hover:opacity-30"></div>

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-500">
            © 2024 Dashboard Operacional. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(0);
          }
          100% {
            transform: translateX(100%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

LoginPageLayout.displayName = 'LoginPageLayout';

