'use client';

import { useEffect, useState } from 'react';

type IdleCallbackHandle = number;

declare global {
  interface Window {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => IdleCallbackHandle;
    cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
  }
}

interface UseDeferredMountOptions {
  enabled?: boolean;
  timeoutMs?: number;
}

export function useDeferredMount(options: UseDeferredMountOptions = {}) {
  const { enabled = true, timeoutMs = 250 } = options;
  const [isMounted, setIsMounted] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsMounted(true);
      return;
    }

    setIsMounted(false);

    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;
    let idleId: IdleCallbackHandle | null = null;

    const mount = () => setIsMounted(true);

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(mount, { timeout: timeoutMs });
    } else {
      timeoutId = window.setTimeout(mount, timeoutMs);
    }

    return () => {
      if (idleId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, timeoutMs]);

  return isMounted;
}
