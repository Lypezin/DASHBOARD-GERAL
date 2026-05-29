import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

const CITY_UPDATES_CACHE_TTL_MS = 60 * 1000;
let cityUpdatesCache: { data: unknown[]; expiresAt: number } | null = null;

export async function GET() {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    if (cityUpdatesCache && cityUpdatesCache.expiresAt > Date.now()) {
        return NextResponse.json({ data: cityUpdatesCache.data, error: null });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_city_last_updates');

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
