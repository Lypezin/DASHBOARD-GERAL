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
    const { data: isGlobal, error: globalError } = await supabase.rpc('is_global_admin');

    if (globalError) {
        return NextResponse.json({ data: null, error: globalError.message, details: globalError }, { status: 500 });
    }

    if (!isGlobal) {
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('organization_id')
            .eq('id', auth.user.id)
            .single();

        if (profileError) {
            return NextResponse.json({ data: null, error: profileError.message, details: profileError }, { status: 500 });
        }

        return NextResponse.json({
            data: {
                isGlobal: false,
                organizationId: profile?.organization_id || '',
                organizations: [],
            },
            error: null,
        });
    }

    const { data: organizations, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

    if (organizationsError) {
        return NextResponse.json({ data: null, error: organizationsError.message, details: organizationsError }, { status: 500 });
    }

    return NextResponse.json({
        data: {
            isGlobal: true,
            organizationId: Array.isArray(organizations) && organizations.length > 0 ? organizations[0].id : '',
            organizations: Array.isArray(organizations) ? organizations : [],
        },
        error: null,
    });
}
