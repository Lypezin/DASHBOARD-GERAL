'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppBootstrapProvider } from '@/contexts/AppBootstrapContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { UserActivityTracker } from '@/components/UserActivityTracker';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

const PUBLIC_LAYOUT_ROUTES = new Set([
  '/login',
  '/registro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/visual-smoke'
]);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usePublicLayout = pathname ? PUBLIC_LAYOUT_ROUTES.has(pathname) : false;
  const shouldMountActivityTracker = useDeferredMount({ timeoutMs: 1400 });

  // Layout para rotas públicas (Login, Registro, etc.)
  if (usePublicLayout) {
    return (
      <div className="flex min-h-screen w-full flex-col overflow-x-clip bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,1)_32%,rgba(241,245,249,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1)_0%,rgba(15,23,42,0.98)_38%,rgba(3,10,24,1)_100%)]">
        <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      </div>
    );
  }

  // Layout privado com Sidebar colapsável estilo SaaS Premium
  return (
    <AppBootstrapProvider>
      <OrganizationProvider>
        <GamificationProvider>
          <SidebarProvider>
            {shouldMountActivityTracker ? <UserActivityTracker /> : null}
            
            <div className="flex min-h-screen w-full bg-background font-sans text-foreground antialiased transition-colors duration-200">
              {/* Grade de fundo discreta Linear/Vercel */}
              <div className="grid-pattern" />

              {/* Sidebar colapsável protegida com React.Suspense para evitar erro de SSR do useSearchParams */}
              <React.Suspense fallback={<div className="hidden md:block w-16 shrink-0 border-r border-border bg-card h-screen" />}>
                <AppSidebar />
              </React.Suspense>

              {/* Área de Conteúdo à direita */}
              <div className="flex flex-1 flex-col min-w-0">
                {/* Header compacto protegido com React.Suspense para evitar erro de SSR do useSearchParams */}
                <React.Suspense fallback={<div className="h-14 border-b border-border bg-card/95 w-full shrink-0 animate-pulse" />}>
                  <DashboardHeader />
                </React.Suspense>

                {/* Container principal */}
                <main className="flex-1 min-w-0 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </GamificationProvider>
      </OrganizationProvider>
    </AppBootstrapProvider>
  );
}
