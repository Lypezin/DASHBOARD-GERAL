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

const STANDALONE_APP_ROUTES = new Set(['/admin', '/upload', '/perfil']);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usePublicLayout = pathname
    ? PUBLIC_LAYOUT_ROUTES.has(pathname) ||
      pathname.startsWith('/visual-smoke/') ||
      pathname.startsWith('/apresentacao/')
    : false;
  const useStandaloneAppLayout = pathname
    ? STANDALONE_APP_ROUTES.has(pathname) || pathname.startsWith('/perfil/')
    : false;
  const shouldMountActivityTracker = useDeferredMount({ timeoutMs: 1400 });

  // Layout para rotas públicas (Login, Registro, etc.)
  if (usePublicLayout) {
    return (
      <div data-design-world="folhas" className="folhas-world flex min-h-screen w-screen max-w-full flex-col overflow-x-hidden bg-background">
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
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
            
            <div data-design-world="folhas" className="folhas-world flex min-h-screen w-full bg-background font-sans text-foreground antialiased transition-colors duration-200">
              {!useStandaloneAppLayout ? (
                <React.Suspense fallback={<div className="hidden h-screen w-16 shrink-0 border-r border-border bg-card md:block" />}>
                  <AppSidebar />
                </React.Suspense>
              ) : null}

              {/* Área de Conteúdo à direita */}
              <div className="flex flex-1 flex-col min-w-0">
                {!useStandaloneAppLayout ? (
                  <React.Suspense fallback={<div className="h-16 w-full shrink-0 animate-pulse border-b border-border bg-card" />}>
                    <DashboardHeader />
                  </React.Suspense>
                ) : null}

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
