'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';

const PUBLIC_LAYOUT_ROUTES = new Set(['/login', '/registro']);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usePublicLayout = pathname ? PUBLIC_LAYOUT_ROUTES.has(pathname) : false;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {!usePublicLayout && <Header />}
      <main className="flex-1 transition-all duration-300">{children}</main>
    </div>
  );
}
