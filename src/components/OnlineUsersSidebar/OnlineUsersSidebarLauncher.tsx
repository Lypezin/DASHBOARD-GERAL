'use client';

import { useEffect, useState } from 'react';
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
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    if (!currentUser || activated || typeof window === 'undefined') {
      return;
    }

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const browserWindow = typeof window !== 'undefined'
      ? window as Window & {
          requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
          cancelIdleCallback?: (handle: number) => void;
        }
      : null;

    let cancelled = false;

    const warmRealtime = () => {
      void import('./index')
        .catch(() => null)
        .finally(() => {
          if (!cancelled) {
            setActivated(true);
          }
        });
    };

    // Warm the sidebar chunk after idle and activate lightweight presence in background.
    if (browserWindow?.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(() => {
        warmRealtime();
      }, { timeout: 6000 });
    } else {
      timeoutId = window.setTimeout(() => {
        warmRealtime();
      }, 2500);
    }

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (browserWindow?.cancelIdleCallback && idleId !== null) {
        browserWindow.cancelIdleCallback(idleId);
      }
    };
  }, [activated, currentUser]);

  if (!currentUser) return null;

  if (!activated) {
    return (
      <SidebarTrigger
        isOpen={false}
        setIsOpen={() => {
          setOpenOnLoad(true);
          setActivated(true);
        }}
        onlineCount={0}
        unreadCount={0}
      />
    );
  }

  return (
    <DeferredOnlineUsersSidebar
      currentUser={currentUser}
      currentTab={currentTab}
      initialOpen={openOnLoad}
      preloadRealtime
    />
  );
}
