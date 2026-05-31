import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const CITY_UPDATES_CACHE_TTL_MS = 60 * 1000;
let cityUpdatesCache: { data: unknown[]; expiresAt: number } | null = null;

export async function GET() {
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    if (cityUpdatesCache && cityUpdatesCache.expiresAt > Date.now()) {
        return NextResponse.json({ data: cityUpdatesCache.data, error: null });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('get_city_last_updates', {
        p_organization_id: auth.profile.organization_id || null,
    });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    const updates = Array.isArray(data) ? data : [];
    cityUpdatesCache = {
        data: updates,
        expiresAt: Date.now() + CITY_UPDATES_CACHE_TTL_MS,
    };

    return NextResponse.json({ data: updates, error: null });
}
