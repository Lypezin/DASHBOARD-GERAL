'use client';

import { useEffect, useState } from 'react';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

interface UseDeferredMountOptions {
  enabled?: boolean;
  timeoutMs?: number;
}

export function useDeferredMount(options: UseDeferredMountOptions = {}) {
  const { enabled = true, timeoutMs = 250 } = options;
  const [mountState, setMountState] = useState(() => ({
    enabled,
    timeoutMs,
    isMounted: !enabled,
  }));
  const stateMatchesOptions = mountState.enabled === enabled && mountState.timeoutMs === timeoutMs;

  useEffect(() => {
    if (!enabled) {
      setMountState({ enabled, timeoutMs, isMounted: true });
      return;
    }

    setMountState({ enabled, timeoutMs, isMounted: false });

    const mount = () => {
      setMountState((current) => (
        current.enabled === enabled && current.timeoutMs === timeoutMs
          ? { ...current, isMounted: true }
          : current
      ));
    };
    return scheduleIdleTask(mount, { timeoutMs });
  }, [enabled, timeoutMs]);

  // Apply option changes during render so a false -> true toggle cannot mount
  // the deferred subtree for one frame before the effect resets its timer.
  return !enabled || (stateMatchesOptions && mountState.isMounted);
}
