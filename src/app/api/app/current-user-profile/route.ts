import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';

export const runtime = 'nodejs';

export async function GET() {
    const auth = await loadCurrentUserProfile();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    return NextResponse.json({ data: auth.profile, error: null });
}
