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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 shadow-[0_12px_45px_-38px_rgba(15,23,42,0.75)] transition-[background-color,border-color,box-shadow] duration-200 dark:border-slate-800/70 dark:bg-slate-950/80 supports-[backdrop-filter]:backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-95" prefetch={true}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-sm font-black text-white shadow-[0_12px_32px_-18px_rgba(37,99,235,0.75)] dark:border-blue-400/20">
            DG
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="bg-gradient-to-r from-slate-950 to-slate-600 bg-clip-text text-base font-black tracking-tight text-transparent dark:from-white dark:to-slate-300">
              Dashboard Geral
            </span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600/80 dark:text-blue-300/80">
              Operacional
            </span>
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
