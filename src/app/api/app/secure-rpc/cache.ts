import { CurrentUserProfile, hasElevatedRole } from '@/app/api/_shared/currentUserProfile';
import { createRequestKey } from '@/utils/request/createRequestKey';

const SECURE_RPC_CACHE_TTL_MS = 5 * 60_000;
const SECURE_RPC_DETAIL_CACHE_TTL_MS = 20_000;
const MAX_SECURE_RPC_CACHE_ENTRIES = 160;

export type SecureRpcCacheEntry = {
  data: unknown;
  expiresAt: number;
};

export const secureRpcCache = new Map<string, SecureRpcCacheEntry>();
export const inFlightSecureRpc = new Map<string, Promise<unknown>>();

export function getSecureRpcCacheTtl(functionName: string) {
  return functionName === 'get_entregador_detail' || functionName === 'get_entregadores_details'
    ? SECURE_RPC_DETAIL_CACHE_TTL_MS
    : SECURE_RPC_CACHE_TTL_MS;
}

export function normalizeAssignedPracas(profile: CurrentUserProfile) {
  return Array.isArray(profile.assigned_pracas)
    ? profile.assigned_pracas.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function getSecureRpcCacheKey(functionName: string, params: Record<string, unknown>, profile: CurrentUserProfile) {
  return createRequestKey({
    functionName,
    params,
    scope: {
      id: profile.id,
      role: profile.role,
      organization_id: profile.organization_id,
      assigned_pracas: normalizeAssignedPracas(profile),
    },
  });
}

export function cleanupSecureRpcCache(now: number) {
  if (secureRpcCache.size <= MAX_SECURE_RPC_CACHE_ENTRIES) return;

  let removed = 0;
  for (const [key, value] of secureRpcCache.entries()) {
    if (removed >= 30) break;
    if (value.expiresAt <= now) {
      secureRpcCache.delete(key);
      removed++;
    }
  }

  while (secureRpcCache.size > MAX_SECURE_RPC_CACHE_ENTRIES) {
    const oldestKey = secureRpcCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    secureRpcCache.delete(oldestKey);
  }
}

export async function resolveSecureRpcWithCache(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile,
  fetcher: () => Promise<unknown>,
) {
  const cacheKey = getSecureRpcCacheKey(functionName, params, profile);
  const now = Date.now();
  const cached = secureRpcCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return { data: cached.data, cached: true };
  }

  if (cached) {
    secureRpcCache.delete(cacheKey);
  }

  cleanupSecureRpcCache(now);

  const existingRequest = inFlightSecureRpc.get(cacheKey);
  if (existingRequest) {
    return { data: await existingRequest, cached: true };
  }

  const request = fetcher();
  inFlightSecureRpc.set(cacheKey, request);

  try {
    const data = await request;
    secureRpcCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + getSecureRpcCacheTtl(functionName),
    });
    return { data, cached: false };
  } finally {
    inFlightSecureRpc.delete(cacheKey);
  }
}
