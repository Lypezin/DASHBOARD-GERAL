/**
 * Componente para tela de sucesso do registro
 * Extraído de src/app/registro/page.tsx
 */

import React from 'react';

export const RegistroSuccess = React.memo(function RegistroSuccess() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 px-4 py-12">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-20 blur-xl"></div>
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg ring-4 ring-emerald-500/20">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="mb-3 text-3xl font-bold text-white">Conta Criada!</h2>
            <p className="mb-8 text-slate-300">Seu cadastro foi realizado com sucesso.</p>
            
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
                <p className="font-bold text-blue-300">Aguardando Aprovação</p>
              </div>
              <p className="text-sm leading-relaxed text-blue-200/80">
                Um administrador precisa aprovar seu acesso antes que você possa entrar no sistema.
                Você receberá uma notificação quando sua conta for aprovada.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }}></div>
              <p className="ml-2 text-sm font-medium text-slate-400">Redirecionando para o login...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

RegistroSuccess.displayName = 'RegistroSuccess';

