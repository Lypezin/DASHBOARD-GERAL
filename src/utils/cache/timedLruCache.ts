export type TimedCacheEntry<T> = {
  timestamp: number;
  data: T;
};

export type TimedCachePolicy = {
  /** Fresh-hit lifetime. */
  ttlMs: number;
  /** Maximum retention lifetime, including stale-while-revalidate data. */
  staleTtlMs?: number;
  /** Maximum number of keys retained by this cache. */
  maxEntries: number;
};

export function pruneTimedCacheEntries<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  maxAgeMs: number,
  now = Date.now(),
) {
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > maxAgeMs) cache.delete(key);
  }
}

export function getTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  policy: TimedCachePolicy,
  allowStale = false,
  now = Date.now(),
): T | null {
  const maxAgeMs = policy.staleTtlMs ?? policy.ttlMs;
  pruneTimedCacheEntries(cache, maxAgeMs, now);

  const entry = cache.get(key);
  if (!entry) return null;

  const ageMs = now - entry.timestamp;
  if (ageMs > policy.ttlMs && (!allowStale || ageMs > maxAgeMs)) return null;

  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

export function rememberTimedCacheEntry<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  entry: TimedCacheEntry<T>,
  policy: TimedCachePolicy,
  now = Date.now(),
) {
  const maxAgeMs = policy.staleTtlMs ?? policy.ttlMs;
  pruneTimedCacheEntries(cache, maxAgeMs, now);
  cache.delete(key);

  if (now - entry.timestamp > maxAgeMs) return;

  const maxEntries = Math.max(1, Math.trunc(policy.maxEntries));
  while (cache.size >= maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }

  cache.set(key, entry);
}

export function setTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  data: T,
  policy: TimedCachePolicy,
  now = Date.now(),
) {
  rememberTimedCacheEntry(cache, key, { timestamp: now, data }, policy, now);
}
