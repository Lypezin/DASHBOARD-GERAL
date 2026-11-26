'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { readStorage, writeStorage } from '@/utils/storage/jsonStorage';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

interface SidebarStateType {
  collapsed: boolean;
  mobileOpen: boolean;
}

interface SidebarActionsType {
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const SidebarStateContext = createContext<SidebarStateType | undefined>(undefined);
const SidebarActionsContext = createContext<SidebarActionsType | undefined>(undefined);

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

  const setCollapsed = React.useCallback((val: boolean) => {
    setCollapsedState(val);
    if (typeof window !== 'undefined') {
      writeStorage(localStorage, SIDEBAR_COLLAPSED_KEY, String(val));
    }
  }, []);

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

  const actionsValue = useMemo<SidebarActionsType>(() => ({
    setCollapsed,
    toggleSidebar,
    setMobileOpen,
    toggleMobileSidebar,
  }), [setCollapsed, toggleSidebar, toggleMobileSidebar]);

  const stateValue = useMemo<SidebarStateType>(() => ({
    collapsed,
    mobileOpen,
  }), [collapsed, mobileOpen]);

  return (
    <SidebarActionsContext.Provider value={actionsValue}>
      <SidebarStateContext.Provider value={stateValue}>
        {children}
      </SidebarStateContext.Provider>
    </SidebarActionsContext.Provider>
  );
}

export function useSidebarActions() {
  const context = useContext(SidebarActionsContext);
  if (context === undefined) {
    throw new Error('useSidebarActions must be used within a SidebarProvider');
  }
  return context;
}

export function useSidebar() {
  const state = useContext(SidebarStateContext);
  const actions = useContext(SidebarActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
