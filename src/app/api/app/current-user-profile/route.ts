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
    const { data, error } = await supabase.rpc('get_current_user_profile');

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    const profile = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
    return NextResponse.json({ data: profile, error: null });
}
