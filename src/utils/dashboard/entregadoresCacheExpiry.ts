const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Old cache entries cannot be used, even as a fallback after an RPC failure. */
export function getEntregadoresCacheEarliestExpiry(endDates: string[], now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  const staleWindow = endDates.every((endDate) => endDate >= today) ? 30 * MINUTE_MS : DAY_MS;
  return new Date(now - staleWindow).toISOString();
}
