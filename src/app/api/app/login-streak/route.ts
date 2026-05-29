import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('update_login_streak');

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? null, error: null });
}
