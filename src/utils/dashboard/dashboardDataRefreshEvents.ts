export const ENTREGADORES_REFRESH_COMPLETE_EVENT = 'dashboard:entregadores-refresh-complete';

export function notifyEntregadoresRefreshComplete() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ENTREGADORES_REFRESH_COMPLETE_EVENT));
}
