'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { CurrentUser } from '@/types';
import { SidebarTrigger } from './SidebarTrigger';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

const DeferredOnlineUsersSidebar = dynamic(
  () => import('./index').then((mod) => ({ default: mod.OnlineUsersSidebar })),
  { ssr: false }
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
