'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardTabs } from '@/hooks/dashboard/useDashboardTabs';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/auth/useHeaderAvatar';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { SIDEBAR_GROUPS, SIDEBAR_LABELS } from '@/constants/navigation';
import { TabType } from '@/types';
import { SidebarMenuItem } from './SidebarMenuItem';

export function AppSidebar() {
  const { collapsed, setCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const { activeTab, handleTabChange } = useDashboardTabs();
  const { user } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);
  const shouldReduceMotion = useReducedMotion() ?? true;
  const [search, setSearch] = React.useState('');
  const [searchShortcut, setSearchShortcut] = React.useState('Ctrl K');
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setSearchShortcut('⌘ K');
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;

    const contentScroll = document.getElementById('dashboard-content-scroll');
    if (!contentScroll) return;

    const previousOverflowY = contentScroll.style.overflowY;
    contentScroll.style.overflowY = 'hidden';

    return () => {
      contentScroll.style.overflowY = previousOverflowY;
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mobileOpen) {
          setMobileOpen(false);
          return;
        }

        if (document.activeElement === searchRef.current && search) {
          setSearch('');
          searchRef.current?.blur();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCollapsed(false);
        window.setTimeout(() => searchRef.current?.focus(), shouldReduceMotion ? 0 : 180);
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, [mobileOpen, search, setCollapsed, setMobileOpen, shouldReduceMotion]);

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const visibleGroups = React.useMemo(() => SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const label = SIDEBAR_LABELS[item.value] || item.label;
      return label.toLocaleLowerCase('pt-BR').includes(normalizedSearch);
    }),
  })).filter((group) => group.items.length > 0), [normalizedSearch]);

  const handleItemClick = (value: TabType) => {
    handleTabChange(value);
    setMobileOpen(false);
  };

  const renderNavItems = (isMobile = false) => visibleGroups.map((group) => (
    <section key={`${isMobile ? 'mobile-' : ''}${group.name}`} className="space-y-1.5">
      <div className={cn(
        'flex h-5 items-center gap-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70',
        collapsed && !isMobile && 'justify-center px-0'
      )}>
        {!collapsed || isMobile ? <span className="truncate">{group.name}</span> : null}
        {collapsed && !isMobile ? (
          <span className="h-px w-7 bg-border" aria-hidden="true" />
        ) : (
          <span className="h-px min-w-3 flex-1 bg-border/70" aria-hidden="true" />
        )}
      </div>

      <div className="space-y-0.5">
        {group.items.map((item) => {
          const isActive = activeTab === item.value;
          const displayLabel = SIDEBAR_LABELS[item.value] || item.label;

          return (
            <SidebarMenuItem
              key={item.value}
              item={item}
              isActive={isActive}
              collapsed={collapsed && !isMobile}
              reducedMotion={shouldReduceMotion}
              displayLabel={displayLabel}
              onClick={handleItemClick}
            />
          );
        })}
      </div>
    </section>
  ));

  const sidebarContent = (isMobile = false) => (
    <>
      <div className={cn(
        'relative flex h-[68px] shrink-0 items-center border-b border-border/80 px-3.5',
        collapsed && !isMobile ? 'justify-center px-0' : 'justify-between gap-2.5'
      )}>
        <Link
          href="/"
          aria-label="Dashboard Geral — início"
          className={cn('flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', collapsed && !isMobile && 'justify-center')}
        >
          <Image
            src="/logo.png"
            alt="GO Itaim"
            width={38}
            height={38}
            priority
            className="h-[38px] w-[38px] shrink-0 rounded-xl border border-border/50 bg-card object-contain shadow-sm"
          />
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -5 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.14 }}
                className="flex min-w-0 flex-col"
              >
                <span className="truncate text-[13px] font-bold tracking-[-0.025em] text-foreground">Dashboard Geral</span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-primary">Operação · Itaim</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fechar menu de navegação"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed && 'absolute -right-3 z-10 h-7 w-7 border border-border bg-card shadow-sm hover:bg-muted'
            )}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain subtle-scrollbar', collapsed && !isMobile ? 'px-2 py-3.5' : 'px-3 py-3.5')}>
        {(!collapsed || isMobile) && (
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" aria-hidden="true" />
            <Input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar guia..."
              aria-label="Buscar guia no menu"
              className="h-9 rounded-[10px] border-border/80 bg-background/80 pl-9 pr-[4.6rem] text-xs shadow-none placeholder:text-muted-foreground/75 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-[19px] -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-card px-1.5 font-sans text-[9px] font-medium text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
              {searchShortcut}
            </kbd>
          </div>
        )}

        <nav aria-label="Guias do dashboard" className="space-y-5">
          {visibleGroups.length > 0 ? renderNavItems(isMobile) : (
            <p className={cn('px-2.5 py-3 text-xs text-muted-foreground', collapsed && !isMobile && 'sr-only')}>
              Nenhuma guia encontrada.
            </p>
          )}
        </nav>
      </div>

      <div className={cn('shrink-0 border-t border-border/80', collapsed && !isMobile ? 'p-2' : 'p-3')}>
        {user ? (
          <Link
            href="/perfil"
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
              'group flex min-w-0 items-center gap-2.5 rounded-[10px] p-1.5 transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed && !isMobile && 'justify-center p-1'
            )}
            title={collapsed && !isMobile ? user.full_name : undefined}
          >
            <Avatar className="h-8 w-8 shrink-0 border border-border shadow-sm transition-transform duration-150 group-hover:scale-[1.04]">
              <AvatarImage src={avatarUrl || user.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {user.full_name?.trim().charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {(!collapsed || isMobile) && (
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[11px] font-semibold text-foreground">{user.full_name || 'Usuário'}</span>
                <span className="truncate text-[10px] text-muted-foreground">{user.is_admin ? 'Administrador' : user.email}</span>
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={shouldReduceMotion
          ? { duration: 0 }
          : { type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 hidden h-dvh shrink-0 select-none flex-col overflow-hidden border-r border-border/80 bg-card md:flex"
        aria-label="Menu lateral"
      >
        {sidebarContent()}
      </motion.aside>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.46 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 cursor-default bg-slate-950 md:hidden"
              aria-label="Fechar menu de navegação"
            />
            <motion.aside
              initial={{ x: shouldReduceMotion ? 0 : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: shouldReduceMotion ? 0 : '-100%' }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col overflow-hidden border-r border-border bg-card shadow-2xl md:hidden"
              aria-label="Menu de navegação"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
