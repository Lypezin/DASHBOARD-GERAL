'use client';

import Link from 'next/link';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/auth/useHeaderAvatar';
import { HeaderDesktopMenu } from './HeaderDesktopMenu';
import { HeaderMobileMenu } from './HeaderMobileMenu';

export function Header() {
  const { user, isLoading, hasTriedAuth, handleLogout } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);

  if (isLoading && !hasTriedAuth) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/95 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/95 supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur-sm dark:supports-[backdrop-filter]:bg-slate-950/85">
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
