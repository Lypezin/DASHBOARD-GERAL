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
import { MotionConfig } from 'framer-motion';
import { TopLoader } from '@/components/ui/TopLoader';

function DeferredUserActivityTracker() {
  const ready = useDeferredMount({ timeoutMs: 1400 });
  return ready ? <UserActivityTracker /> : null;
}

const PUBLIC_LAYOUT_ROUTES = new Set([
  '/login',
  '/registro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/visual-smoke'
]);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usePublicLayout = pathname
    ? PUBLIC_LAYOUT_ROUTES.has(pathname) ||
      pathname.startsWith('/visual-smoke/') ||
      pathname.startsWith('/apresentacao/')
    : false;

  // Layout para rotas públicas (Login, Registro, etc.)
  if (usePublicLayout) {
    return (
      <MotionConfig reducedMotion="user">
        <React.Suspense fallback={null}>
          <TopLoader />
        </React.Suspense>
        <div className="flex min-h-screen w-screen max-w-full flex-col overflow-x-hidden bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,1)_32%,rgba(241,245,249,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1)_0%,rgba(15,23,42,0.98)_38%,rgba(3,10,24,1)_100%)]">
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </MotionConfig>
    );
  }

  // Layout privado com Sidebar colapsável estilo SaaS Premium
  return (
    <MotionConfig reducedMotion="user">
      <React.Suspense fallback={null}>
        <TopLoader />
      </React.Suspense>
      <AppBootstrapProvider>
        <OrganizationProvider>
          <GamificationProvider>
            <SidebarProvider>
              <DeferredUserActivityTracker />

              <div className="relative flex h-dvh min-h-0 w-full overflow-hidden bg-background font-sans text-foreground antialiased transition-colors duration-200">
                {/* Grade de fundo discreta Linear/Vercel */}
                <div className="grid-pattern !z-0" aria-hidden="true" />

                {/* Sidebar colapsável protegida com React.Suspense para evitar erro de SSR do useSearchParams */}
                <React.Suspense fallback={
                  <aside
                    aria-label="Carregando menu lateral"
                    className="hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border/80 bg-card md:flex"
                  >
                    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 px-3.5">
                      <div className="dashboard-loading-shimmer h-[38px] w-[38px] shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <div className="dashboard-loading-shimmer h-3 w-28 rounded-full" />
                        <div className="dashboard-loading-shimmer h-2 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="dashboard-loading-shimmer h-9 w-full rounded-[10px]" />
                      {Array.from({ length: 7 }, (_, i) => (
                        <div key={i} className="dashboard-loading-shimmer h-9 w-full rounded-[9px]" />
                      ))}
                    </div>
                  </aside>
                }>
                  <AppSidebar />
                </React.Suspense>

                {/* Área de Conteúdo à direita */}
                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                  {/* Header compacto protegido com React.Suspense para evitar erro de SSR do useSearchParams */}
                  <React.Suspense fallback={
                    <div
                      aria-label="Carregando cabeçalho"
                      className="flex h-[5.5rem] w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 sm:px-6 lg:h-14 lg:px-8"
                    >
                      <div className="dashboard-loading-shimmer h-5 w-44 rounded-full" />
                      <div className="dashboard-loading-shimmer hidden h-5 w-72 rounded-full lg:block" />
                      <div className="flex items-center gap-2">
                        <div className="dashboard-loading-shimmer h-9 w-9 rounded-full" />
                        <div className="dashboard-loading-shimmer h-9 w-9 rounded-full" />
                      </div>
                    </div>
                  }>
                    <DashboardHeader />
                  </React.Suspense>

                  {/* Container principal */}
                  <main id="dashboard-content-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </GamificationProvider>
        </OrganizationProvider>
      </AppBootstrapProvider>
    </MotionConfig>
  );
}
