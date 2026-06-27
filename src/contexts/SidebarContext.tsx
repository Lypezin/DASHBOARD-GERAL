'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { readStorage, writeStorage } from '@/utils/storage/jsonStorage';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Carregar estado salvo do localStorage após a montagem do componente (para compatibilidade SSR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = readStorage(localStorage, SIDEBAR_COLLAPSED_KEY);
      if (savedState !== null) {
        setCollapsedState(savedState === 'true');
      }
    }
  }, []);

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    if (typeof window !== 'undefined') {
      writeStorage(localStorage, SIDEBAR_COLLAPSED_KEY, String(val));
    }
  };

  const toggleSidebar = React.useCallback(() => {
    setCollapsedState((prev) => {
      const val = !prev;
      if (typeof window !== 'undefined') {
        writeStorage(localStorage, SIDEBAR_COLLAPSED_KEY, String(val));
      }
      return val;
    });
  }, []);

  const toggleMobileSidebar = React.useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Ouvir atalhos de teclado globais (Ctrl + \ ou Cmd + \)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
