import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_city_last_updates');

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [], error: null });
}
