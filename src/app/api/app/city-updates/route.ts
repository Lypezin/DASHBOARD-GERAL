import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const CITY_UPDATES_CACHE_TTL_MS = 30 * 60 * 1000;
const cityUpdatesCache = new Map<string, { data: unknown[]; expiresAt: number }>();

export async function GET() {
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const organizationId = auth.profile.organization_id || null;
    const cacheKey = organizationId || 'no-org';
    const cached = cityUpdatesCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json({ data: cached.data, error: null });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('get_city_last_updates', {
        p_organization_id: organizationId,
    });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    const updates = Array.isArray(data) ? data : [];
    cityUpdatesCache.set(cacheKey, {
        data: updates,
        expiresAt: Date.now() + CITY_UPDATES_CACHE_TTL_MS,
    });

    return NextResponse.json({ data: updates, error: null });
}
