'use client';

import Link from 'next/link';
import { useHeaderAuth } from '@/hooks/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/useHeaderAvatar';
import { HeaderDesktopMenu } from './HeaderDesktopMenu';
import { HeaderMobileMenu } from './HeaderMobileMenu';

export function Header() {
  const { user, isLoading, hasTriedAuth, handleLogout } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);


  // Não mostrar header nas páginas de login/registro e recuperação de senha
  if (typeof window !== 'undefined' && (
    window.location.pathname === '/login' ||
    window.location.pathname === '/registro' ||
    window.location.pathname === '/esqueci-senha' ||
    window.location.pathname === '/redefinir-senha'
  )) {
    return null;
  }

  // CRÍTICO: Sempre mostrar header após timeout ou se já tentou autenticar
  if (isLoading && !hasTriedAuth) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90" prefetch={true}>
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
