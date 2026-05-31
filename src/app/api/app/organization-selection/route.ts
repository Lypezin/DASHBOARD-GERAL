import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const isGlobal = hasElevatedRole(auth.profile);

    if (!isGlobal) {
        return NextResponse.json({
            data: {
                isGlobal: false,
                organizationId: auth.profile.organization_id || '',
                organizations: [],
            },
            error: null,
        });
    }

    const supabase = createServiceRoleClient();
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
