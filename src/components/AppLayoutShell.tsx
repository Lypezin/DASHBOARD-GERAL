'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { AppBootstrapProvider } from '@/contexts/AppBootstrapContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { UserActivityTracker } from '@/components/UserActivityTracker';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

const PUBLIC_LAYOUT_ROUTES = new Set([
  '/login',
  '/registro',
  '/esqueci-senha',
  '/redefinir-senha'
]);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usePublicLayout = pathname ? PUBLIC_LAYOUT_ROUTES.has(pathname) : false;
  const shouldMountActivityTracker = useDeferredMount({ timeoutMs: 1400 });

  const shell = (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {!usePublicLayout && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );

  if (usePublicLayout) {
    return shell;
  }

  return (
    <AppBootstrapProvider>
      <OrganizationProvider>
        <GamificationProvider>
          {shouldMountActivityTracker ? <UserActivityTracker /> : null}
          {shell}
        </GamificationProvider>
      </OrganizationProvider>
    </AppBootstrapProvider>
  );
}
