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
    <div className="flex min-h-screen w-full flex-col overflow-x-clip bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,1)_32%,rgba(241,245,249,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1)_0%,rgba(15,23,42,0.98)_38%,rgba(3,10,24,1)_100%)]">
      {!usePublicLayout && <Header />}
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
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
