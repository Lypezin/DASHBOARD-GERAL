'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { CurrentUser } from '@/types';
import { SidebarTrigger } from './SidebarTrigger';

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

  if (!currentUser) return null;

  if (!activated) {
    return (
      <SidebarTrigger
        isOpen={false}
        setIsOpen={() => setActivated(true)}
        onlineCount={0}
        unreadCount={0}
      />
    );
  }

  return <DeferredOnlineUsersSidebar currentUser={currentUser} currentTab={currentTab} initialOpen />;
}
