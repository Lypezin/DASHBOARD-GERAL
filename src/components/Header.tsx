'use client';

import Link from 'next/link';
import { useHeaderAuth } from '@/hooks/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/useHeaderAvatar';
import { HeaderDesktopMenu } from './HeaderDesktopMenu';
import { HeaderMobileMenu } from './HeaderMobileMenu';

export function Header() {
  const { user, isLoading, hasTriedAuth, handleLogout } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);


  // Não mostrar header nas páginas de login/registro
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/registro')) {
    return null;
  }

  // CRÍTICO: Sempre mostrar header após timeout ou se já tentou autenticar
  if (isLoading && !hasTriedAuth) {
    return null;
  }

  return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 sm:px-5 md:px-6 lg:px-8 gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-shrink overflow-hidden" prefetch={true}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-1.5 sm:p-2 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200 shadow-sm flex-shrink-0">
              <span className="text-lg sm:text-xl block text-white">📊</span>
            </div>
            <div className="hidden sm:block min-w-0 overflow-hidden">
              <span className="font-bold text-sm sm:text-base md:text-lg text-foreground tracking-tight truncate block">Dashboard Operacional</span>
              <p className="text-muted-foreground text-xs font-medium hidden md:block truncate">Sistema de Análise</p>
            </div>
            <span className="font-bold text-sm sm:text-base text-foreground sm:hidden truncate">Dashboard</span>
          </Link>

        <HeaderDesktopMenu user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
        <HeaderMobileMenu user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
        </div>
      </header>
  );
}
