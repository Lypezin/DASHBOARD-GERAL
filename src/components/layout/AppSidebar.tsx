'use client';

import React from 'react';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardTabs } from '@/hooks/dashboard/useDashboardTabs';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/auth/useHeaderAvatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { SIDEBAR_GROUPS, SIDEBAR_LABELS } from '@/constants/navigation';
import { TabType } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { prefetchDashboardTabResources } from '@/hooks/dashboard/prefetchDashboardTabResources';

export function AppSidebar() {
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const { activeTab, handleTabChange } = useDashboardTabs();
  const { user } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);

  const handleItemClick = (value: TabType) => {
    handleTabChange(value);
    setMobileOpen(false); // Fecha o menu no mobile ao clicar
  };

  // Renderizador dos itens de navegação comuns
  const renderNavItems = () => {
    return SIDEBAR_GROUPS.map((group) => (
      <div key={group.name} className="space-y-1.5 pt-4">
        {/* Rótulo do Grupo */}
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60"
            >
              {group.name}
            </motion.p>
          ) : (
            <div className="h-4 border-b border-border/20 my-1 mx-3" />
          )}
        </AnimatePresence>

        {/* Itens */}
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = activeTab === item.value;
            const Icon = item.icon;
            const displayLabel = SIDEBAR_LABELS[item.value] || item.label;

            const buttonEl = (
              <button
                onClick={() => handleItemClick(item.value)}
                onMouseEnter={() => prefetchDashboardTabResources(item.value)}
                onFocus={() => prefetchDashboardTabResources(item.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150',
                  'relative overflow-hidden group focus:outline-none',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-current' : 'text-muted-foreground/80 group-hover:text-foreground')} />
                
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate"
                  >
                    {displayLabel}
                  </motion.span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.value} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {buttonEl}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-bold border border-border">
                    {displayLabel}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.value}>{buttonEl}</React.Fragment>;
          })}
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', stiffness: 380, damping: 35 }}
        className={cn(
          'hidden md:flex h-screen flex-col border-r border-border bg-card shrink-0 select-none relative z-50 overflow-x-hidden'
        )}
      >
        {/* Header da Sidebar */}
        <div className={cn(
          "flex h-14 items-center border-b border-border shrink-0 transition-all duration-150",
          collapsed ? "justify-center px-0 w-full" : "justify-between px-3"
        )}>
          <div className={cn("flex items-center min-w-0 transition-all duration-150", collapsed ? "justify-center gap-0 w-full" : "gap-3")}>
            {/* Logo GO Itaim */}
            <Image
              src="/logo.png"
              alt="GO Itaim Logo"
              width={36}
              height={36}
              className={cn(
                "h-9 w-9 shrink-0 rounded-lg object-contain border border-border/40 shadow-sm transition-all duration-150",
                collapsed ? "mx-auto" : ""
              )}
            />
            
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-w-0"
              >
                <span className="truncate text-sm font-black tracking-tight text-foreground">
                  Dashboard Geral
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                  OPERACIONAL
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Itens de Navegação (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 subtle-scrollbar">
          {renderNavItems()}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-border p-2 shrink-0 flex flex-col gap-2">
          {/* Botão para colapsar */}
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </motion.aside>

      {/* OVERLAY MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black md:hidden"
            />

            {/* Sidebar real flutuante */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col bg-card border-r border-border shadow-2xl md:hidden"
            >
              {/* Header Mobile */}
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="GO Itaim Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-lg object-contain border border-border/30"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">Dashboard Geral</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-primary">OPERACIONAL</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navegação Mobile */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {/* Aqui os itens são sempre expandidos (collapsed = false) */}
                {(() => {
                  return SIDEBAR_GROUPS.map((group) => (
                    <div key={`mobile-${group.name}`} className="space-y-1.5 pt-2">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        {group.name}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = activeTab === item.value;
                          const Icon = item.icon;
                          const displayLabel = SIDEBAR_LABELS[item.value] || item.label;

                          return (
                            <button
                              key={`mobile-${item.value}`}
                              onClick={() => handleItemClick(item.value)}
                              onMouseEnter={() => prefetchDashboardTabResources(item.value)}
                              onFocus={() => prefetchDashboardTabResources(item.value)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150',
                                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <Icon className="h-[18px] w-[18px]" />
                              <span>{displayLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
