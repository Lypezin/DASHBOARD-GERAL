import type { CurrentUser } from '@/types';
import { createRequestKey } from './createRequestKey';

/** Stable client cache/request scope for data whose visibility follows a profile. */
export function createAccessScopeKey(user: CurrentUser | null | undefined, organizationId?: string | null) {
  const assignedPracas = Array.isArray(user?.assigned_pracas)
    ? Array.from(new Set(user.assigned_pracas.map((praca) => String(praca).trim()).filter(Boolean))).sort()
    : [];

  return createRequestKey({
    userId: user?.id || null,
    organizationId: organizationId || user?.organization_id || null,
    isAdmin: user?.is_admin === true,
    role: user?.role || null,
    assignedPracas,
  });
}
