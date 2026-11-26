export const ENTREGADORES_REFRESH_COMPLETE_EVENT = 'dashboard:entregadores-refresh-complete';
const CROSS_TAB_REFRESH_STORAGE_KEY = 'dashboard:last_refresh_at';
const SESSION_CACHE_PREFIXES = [
  'city_last_updates_cache_v4:',
  'dashboard_dimensions_cache_v8:',
  'dashboard_cache_v2_',
] as const;

const clientRefreshCleanups = new Set<() => void>();
let crossTabListenerAttached = false;

export function registerClientRefreshCleanup(cleanup: () => void): void {
  clientRefreshCleanups.add(cleanup);
}

export function clearAllClientDataCaches(): void {
  clientRefreshCleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch {
      // Ignore cleanup errors so remaining client caches are still invalidated.
    }
  });

  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key) continue;
      if (SESSION_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Storage access may be restricted; in-memory cleanup above still applies.
  }
}

function dispatchRefreshCompleteEvent(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ENTREGADORES_REFRESH_COMPLETE_EVENT));
}

if (typeof window !== 'undefined' && !crossTabListenerAttached) {
  crossTabListenerAttached = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== CROSS_TAB_REFRESH_STORAGE_KEY || !event.newValue) {
      return;
    }
    clearAllClientDataCaches();
    dispatchRefreshCompleteEvent();
  });
}

export function notifyEntregadoresRefreshComplete(): void {
  clearAllClientDataCaches();
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CROSS_TAB_REFRESH_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage quota/privacy failures; same-tab invalidation still runs.
  }

  dispatchRefreshCompleteEvent();
}
