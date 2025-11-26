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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90" prefetch={true}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <span className="text-sm font-bold text-white">DO</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-foreground">Dashboard</span>
            <span className="text-xs font-medium text-muted-foreground">Operacional</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <HeaderDesktopMenu user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
          <HeaderMobileMenu user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}
