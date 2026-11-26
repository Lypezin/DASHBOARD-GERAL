import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { safeLog } from '@/lib/errorHandler';
import { createServiceRoleClient, getServiceRoleConfigErrorPayload, isServiceRoleConfigError } from '@/utils/supabase/admin';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';

export const runtime = 'nodejs';

const ORG_CACHE_POLICY = { ttlMs: 60_000, maxEntries: 128 } as const;
const organizationCache = new Map<string, TimedCacheEntry<Record<string, unknown> | null>>();
const inFlightOrganizationRequests = new Map<string, Promise<Record<string, unknown> | null>>();

async function loadOrganizationForProfile(organizationId?: string | null): Promise<Record<string, unknown> | null> {
    const normalizedOrgId = typeof organizationId === 'string' ? organizationId.trim() : '';
    if (!normalizedOrgId) return null;

    const cached = getTimedCacheValue(organizationCache, normalizedOrgId, ORG_CACHE_POLICY);
    if (cached !== null) return cached;

    const existing = inFlightOrganizationRequests.get(normalizedOrgId);
    if (existing) return existing;

    const request = (async () => {
        try {
            const admin = createServiceRoleClient();
            const { data, error } = await admin
                .from('organizations')
                .select('id, name, slug, max_users, is_active, created_at, updated_at')
                .eq('id', normalizedOrgId)
                .maybeSingle();

            if (error || !data) return null;

            const organization = data as Record<string, unknown>;
            setTimedCacheValue(organizationCache, normalizedOrgId, organization, ORG_CACHE_POLICY);
            return organization;
        } catch {
            return null;
        } finally {
            inFlightOrganizationRequests.delete(normalizedOrgId);
        }
    })();

    inFlightOrganizationRequests.set(normalizedOrgId, request);
    return request;
}

export async function GET() {
    try {
        const auth = await loadCurrentUserProfile();
        if ('failure' in auth) {
            return NextResponse.json({
                data: null,
                code: auth.failure.code,
                error: auth.failure.message,
            }, { status: auth.failure.status });
        }

        const organization = await loadOrganizationForProfile(auth.profile.organization_id);

        return NextResponse.json({ data: auth.profile, organization, error: null });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({
                data: null,
                code: payload.code,
                error: 'Configuração do servidor incompleta. Defina SUPABASE_SERVICE_ROLE_KEY localmente ou nas variáveis do deploy; não use o prefixo NEXT_PUBLIC_.',
            }, { status: 503 });
        }

        safeLog.error('Erro ao carregar perfil do usuário atual:', error);
        return NextResponse.json({ data: null, error: 'Erro interno ao validar o perfil do usuário.' }, { status: 500 });
    }
}
