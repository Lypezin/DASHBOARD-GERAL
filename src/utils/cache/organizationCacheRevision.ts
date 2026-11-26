import 'server-only';
import { createServiceRoleClient } from '@/utils/supabase/admin';

const REVISION_MICRO_TTL_MS = 15_000;
const MAX_REVISION_CACHE_ENTRIES = 128;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REVISION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d+$/i;

type CacheInvalidator = (organizationId?: string | null) => void;

const revisionCache = new Map<string, { revision: string; expiresAt: number }>();
const inFlightRevisions = new Map<string, Promise<string | null>>();
const invalidators = new Set<CacheInvalidator>();

export function registerServerCacheInvalidator(fn: CacheInvalidator): void {
  invalidators.add(fn);
}

export function invalidateServerDataCaches(organizationId?: string | null): void {
  const normalizedOrgId = typeof organizationId === 'string' ? organizationId.trim() : '';
  if (normalizedOrgId) {
    revisionCache.delete(normalizedOrgId);
  } else {
    revisionCache.clear();
  }

  invalidators.forEach((invalidator) => {
    try {
      invalidator(normalizedOrgId || null);
    } catch {
      // Ignore individual invalidator failures so other server caches still clear.
    }
  });
}

export async function getCachedOrganizationRevision(organizationId: string | null | undefined): Promise<string | null> {
  const normalizedOrgId = typeof organizationId === 'string' ? organizationId.trim() : '';
  if (!normalizedOrgId || !UUID_RE.test(normalizedOrgId)) {
    return null;
  }

  const now = Date.now();
  const cached = revisionCache.get(normalizedOrgId);
  if (cached && cached.expiresAt > now) {
    return cached.revision;
  }
  if (cached) {
    revisionCache.delete(normalizedOrgId);
  }

  const existingRequest = inFlightRevisions.get(normalizedOrgId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const admin = createServiceRoleClient();
      const { data, error } = await admin.rpc('get_dashboard_cache_revision', {
        p_organization_id: normalizedOrgId,
      });

      if (error || typeof data !== 'string' || !REVISION_RE.test(data)) {
        return null;
      }

      if (revisionCache.size >= MAX_REVISION_CACHE_ENTRIES) {
        const oldestKey = revisionCache.keys().next().value;
        if (oldestKey) revisionCache.delete(oldestKey);
      }

      revisionCache.set(normalizedOrgId, {
        revision: data,
        expiresAt: Date.now() + REVISION_MICRO_TTL_MS,
      });

      return data;
    } catch {
      return null;
    }
  })().finally(() => {
    if (inFlightRevisions.get(normalizedOrgId) === request) {
      inFlightRevisions.delete(normalizedOrgId);
    }
  });

  inFlightRevisions.set(normalizedOrgId, request);
  return request;
}
