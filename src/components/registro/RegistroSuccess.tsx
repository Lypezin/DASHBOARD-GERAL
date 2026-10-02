/**
 * Componente para tela de sucesso do registro
 * Extraído de src/app/registro/page.tsx
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LoginPageLayout } from '@/components/login/LoginPageLayout';

export const RegistroSuccess = React.memo(function RegistroSuccess() {
  return (
    <LoginPageLayout>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Conta criada</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Seu cadastro foi realizado com sucesso.</p>
        </div>
        <div className="rounded-md border border-amber-200/80 bg-amber-50/70 p-4 text-left dark:border-amber-900/70 dark:bg-amber-950/20">
          <p className="mb-1 font-semibold text-amber-900 dark:text-amber-200">Aguardando aprovação</p>
          <p className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/80">
            Um administrador precisa aprovar seu acesso antes que você possa entrar no sistema. Você receberá uma notificação quando sua conta for aprovada.
          </p>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">Redirecionando para o login em alguns segundos…</p>
      </div>
    </LoginPageLayout>
  );
});

RegistroSuccess.displayName = 'RegistroSuccess';

