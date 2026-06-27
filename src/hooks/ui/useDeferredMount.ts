'use client';

import { useEffect, useState } from 'react';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

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

    const mount = () => setIsMounted(true);
    return scheduleIdleTask(mount, { timeoutMs });
  }, [enabled, timeoutMs]);

  return isMounted;
}
