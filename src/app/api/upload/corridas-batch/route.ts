import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

type CurrentUserProfile = {
    id?: string;
    role?: string;
    is_admin?: boolean;
    is_approved?: boolean;
    organization_id?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeProfile(profile: unknown): CurrentUserProfile | null {
    if (Array.isArray(profile)) {
        return (profile[0] as CurrentUserProfile) || null;
    }

    return (profile as CurrentUserProfile) || null;
}

function isPrivileged(profile: CurrentUserProfile) {
    const role = String(profile.role || '').toLowerCase();
    return profile.is_admin === true || role === 'admin' || role === 'master';
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ success: false, error: 'Usuario nao autenticado.' }, { status: 401 });
        }

        const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');
        const profile = normalizeProfile(profileData);

        if (profileError || !profile) {
            return NextResponse.json({ success: false, error: 'Nao foi possivel validar o perfil do usuario.' }, { status: 403 });
        }

        if (profile.is_approved !== true) {
            return NextResponse.json({ success: false, error: 'Usuario ainda nao aprovado.' }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const rawRows = body?.dados;
        const requestedOrganizationId = body?.organizationId;

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Nenhum dado recebido para importacao.' }, { status: 400 });
        }

        const profileOrganizationId = profile.organization_id || null;
        const organizationId =
            typeof requestedOrganizationId === 'string' && UUID_RE.test(requestedOrganizationId)
                ? requestedOrganizationId
                : profileOrganizationId;

        if (!organizationId || !UUID_RE.test(organizationId)) {
            return NextResponse.json({ success: false, error: 'Organizacao invalida para importacao.' }, { status: 400 });
        }

        if (!isPrivileged(profile) && profileOrganizationId && organizationId !== profileOrganizationId) {
            return NextResponse.json({ success: false, error: 'Organizacao nao permitida para este usuario.' }, { status: 403 });
        }

        const rows = rawRows.map((row) => ({
            ...(row && typeof row === 'object' ? row : {}),
            organization_id: organizationId
        }));

        const admin = createServiceRoleClient();
        const { data, error } = await admin.rpc('insert_dados_corridas_batch', { dados: rows });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message, details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data || { success: true, inserted: rows.length, errors: 0 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido no upload.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
