'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { CurrentUser } from '@/types';
import { SidebarTrigger } from './SidebarTrigger';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

const DeferredOnlineUsersSidebar = dynamic(
  () => import('./index').then((mod) => ({ default: mod.OnlineUsersSidebar })),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Carregando chat da equipe"
        className="fixed bottom-5 right-5 z-[45] flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-950"
      >
        <Loader2 className="h-5 w-5 motion-safe:animate-spin text-blue-600 dark:text-sky-300" aria-hidden="true" />
      </div>
    ),
  }
);

interface OnlineUsersSidebarLauncherProps {
  currentUser: CurrentUser | null;
  currentTab: string;
}

export function OnlineUsersSidebarLauncher({ currentUser, currentTab }: OnlineUsersSidebarLauncherProps) {
  const [activated, setActivated] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const shouldPreloadPresence = useDeferredMount({
    enabled: Boolean(currentUser),
    timeoutMs: 1200,
  });
  const shouldMountRealtime = activated || shouldPreloadPresence;

  if (!currentUser) return null;

  if (!shouldMountRealtime) {
    return (
      <SidebarTrigger
        isOpen={false}
        setIsOpen={() => {
          setIsMinimized(false);
          setOpenOnLoad(true);
          setActivated(true);
        }}
        onlineCount={0}
        unreadCount={0}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />
    );
  }

  return (
    <DeferredOnlineUsersSidebar
      currentUser={currentUser}
      currentTab={currentTab}
      initialOpen={openOnLoad}
      initialMinimized={isMinimized}
      onMinimizedChange={setIsMinimized}
      preloadRealtime={shouldPreloadPresence}
    />
  );
}
