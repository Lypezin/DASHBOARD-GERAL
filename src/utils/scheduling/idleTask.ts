interface ScheduleIdleTaskOptions {
  timeoutMs?: number;
  fallbackDelayMs?: number;
}

export function scheduleIdleTask(
  callback: () => void,
  options: ScheduleIdleTaskOptions = {}
) {
  if (typeof window === 'undefined') {
    callback();
    return () => undefined;
  }

  const { timeoutMs = 1000, fallbackDelayMs = timeoutMs } = options;

  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => {
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, fallbackDelayMs);
  return () => window.clearTimeout(timeoutId);
}
