'use client';

import React from 'react';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardTabs } from '@/hooks/dashboard/useDashboardTabs';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/auth/useHeaderAvatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SIDEBAR_GROUPS, SIDEBAR_LABELS } from '@/constants/navigation';
import { TabType } from '@/types';
import { SidebarMenuItem } from './SidebarMenuItem';

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
        {!collapsed ? (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
            {group.name}
          </p>
        ) : (
          <div className="my-1 mx-3 h-4 border-b border-white/20" />
        )}

        {/* Itens */}
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = activeTab === item.value;
            const displayLabel = SIDEBAR_LABELS[item.value] || item.label;

            return (
              <SidebarMenuItem
                key={item.value}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                displayLabel={displayLabel}
                onClick={handleItemClick}
              />
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside
        style={{ width: collapsed ? 68 : 260 }}
        className={cn(
          'relative z-50 hidden h-screen shrink-0 select-none flex-col overflow-x-hidden border-r border-white/10 bg-[hsl(var(--sidebar))] text-white transition-[width] duration-200 md:flex'
        )}
      >
        {/* Header da Sidebar */}
        <div className={cn(
          "flex shrink-0 items-center border-b border-white/25 transition-all duration-150",
          collapsed ? "h-16 justify-center px-0" : "h-56 justify-center px-6"
        )}>
          <div className={cn("flex min-w-0 items-center transition-all duration-150", collapsed ? "justify-center" : "w-full flex-col gap-3")}>
            {/* Logo GO Itaim */}
            <Image
              src="/logo.png"
              alt="GO Itaim Logo"
              width={136}
              height={136}
              className={cn(
                "shrink-0 object-contain transition-all duration-150",
                collapsed ? "h-10 w-10" : "h-32 w-32"
              )}
            />
            
            {!collapsed && (
              <div className="w-full border-t border-white/35 pt-4 text-center">
                <span className="block truncate text-xs font-semibold uppercase tracking-[0.15em] text-white">
                  Dashboard Geral
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Itens de Navegação (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 subtle-scrollbar">
          {renderNavItems()}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-white/10 p-2 shrink-0 flex flex-col gap-2">
          {/* Botão para colapsar */}
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-white/65 hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

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
              className="fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[hsl(var(--sidebar))] text-white shadow-2xl md:hidden"
            >
              {/* Header Mobile */}
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="GO Itaim Logo"
                    width={32}
                    height={32}
                    className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Dashboard Geral</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/60">OPERACIONAL</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navegação Mobile */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {/* Aqui os itens são sempre expandidos (collapsed = false) */}
                {SIDEBAR_GROUPS.map((group) => (
                  <div key={`mobile-${group.name}`} className="space-y-1.5 pt-2">
                    <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55">
                      {group.name}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = activeTab === item.value;
                        const displayLabel = SIDEBAR_LABELS[item.value] || item.label;

                        return (
                          <SidebarMenuItem
                            key={`mobile-${item.value}`}
                            item={item}
                            isActive={isActive}
                            collapsed={false}
                            displayLabel={displayLabel}
                            onClick={handleItemClick}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
