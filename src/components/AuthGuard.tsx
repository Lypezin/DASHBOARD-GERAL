/**
 * Componente wrapper para proteção de rotas
 * Usa useAuthGuard para verificar autenticação antes de renderizar conteúdo
 */

import { ReactNode } from 'react';
import { useAuthGuard, AuthGuardOptions } from '@/hooks/auth/useAuthGuard';

interface AuthGuardProps extends AuthGuardOptions {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export function AuthGuard({
  children,
  fallback,
  loadingComponent,
  ...authOptions
}: AuthGuardProps) {
  const { isChecking, isAuthenticated } = useAuthGuard(authOptions);

  if (isChecking) {
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}

