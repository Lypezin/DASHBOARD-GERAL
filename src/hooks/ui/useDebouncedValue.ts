import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number, enabled = true) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!enabled) {
      setDebouncedValue(value);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, enabled, value]);

  return debouncedValue;
}
