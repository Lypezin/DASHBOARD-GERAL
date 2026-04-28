import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const ADMIN_RPC_ALLOWLIST = new Set([
    'approve_user',
    'create_organization',
    'list_all_organizations',
    'list_all_users',
    'list_pending_users',
    'revoke_user_access',
    'set_user_admin',
    'update_organization',
    'update_user_organization',
    'update_user_pracas',
    'update_user_role'
]);

type CurrentUserProfile = {
    id?: string;
    role?: string;
    is_admin?: boolean;
    is_approved?: boolean;
    organization_id?: string | null;
};

function normalizeProfile(profile: unknown): CurrentUserProfile | null {
    if (Array.isArray(profile)) {
        return (profile[0] as CurrentUserProfile) || null;
    }

    return (profile as CurrentUserProfile) || null;
}

function canUseAdminApi(profile: CurrentUserProfile) {
    const role = String(profile.role || '').toLowerCase();
    return profile.is_approved === true && (profile.is_admin === true || role === 'admin' || role === 'master');
}

function assertValidSlug(slug: string) {
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('Slug invalido. Use apenas letras minusculas, numeros e hifens.');
    }
}

function normalizeRole(role: unknown) {
    const value = typeof role === 'string' && role ? role : 'user';
    if (!['admin', 'marketing', 'user', 'master'].includes(value)) {
        throw new Error('Role invalido. Use admin, marketing, master ou user.');
    }
    return value as 'admin' | 'marketing' | 'user' | 'master';
}

function buildUserUpdate(params: Record<string, unknown>, approvedBy?: string | null, approve = false) {
    const role = normalizeRole(params.p_role);
    const pracas = Array.isArray(params.pracas) ? params.pracas.filter((item) => typeof item === 'string') : [];
    const organizationId = typeof params.p_organization_id === 'string' && params.p_organization_id
        ? params.p_organization_id
        : undefined;

    return {
        ...(approve ? {
            is_approved: true,
            approved_at: new Date().toISOString(),
            approved_by: approvedBy || null
        } : {}),
        assigned_pracas: role === 'marketing' ? [] : pracas,
        role,
        is_admin: role === 'admin' || role === 'master',
        ...(organizationId ? { organization_id: organizationId } : {})
    };
}

function getStringParam(params: Record<string, unknown>, key: string) {
    const value = params[key];
    return typeof value === 'string' ? value : '';
}

async function executeAdminOperation(
    rpcName: string,
    params: Record<string, unknown>,
    profile: CurrentUserProfile
) {
    const admin = createServiceRoleClient();

    switch (rpcName) {
        case 'list_all_users': {
            return admin
                .from('user_profiles')
                .select('id, full_name, email, role, is_admin, is_approved, created_at, approved_at, organization_id, assigned_pracas, avatar_url')
                .order('created_at', { ascending: false });
        }
        case 'list_pending_users': {
            return admin
                .from('user_profiles')
                .select('id, full_name, email, role, is_admin, is_approved, created_at, approved_at, organization_id, assigned_pracas, avatar_url')
                .eq('is_approved', false)
                .order('created_at', { ascending: false });
        }
        case 'approve_user': {
            const userId = getStringParam(params, 'user_id');
            return admin
                .from('user_profiles')
                .update(buildUserUpdate(params, profile.id || null, true))
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'update_user_pracas': {
            const userId = getStringParam(params, 'user_id');
            return admin
                .from('user_profiles')
                .update(buildUserUpdate(params, null, false))
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'revoke_user_access': {
            const userId = getStringParam(params, 'user_id');
            return admin
                .from('user_profiles')
                .update({ is_approved: false, status: 'pending', role: 'user', is_admin: false, assigned_pracas: [] })
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'set_user_admin': {
            const userId = getStringParam(params, 'user_id');
            const makeAdmin = params.make_admin === true;

            if (userId === profile.id && !makeAdmin) {
                throw new Error('Voce nao pode remover seu proprio status de admin.');
            }

            return admin
                .from('user_profiles')
                .update({ is_admin: makeAdmin, role: makeAdmin ? 'admin' : 'user', updated_at: new Date().toISOString() })
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'update_user_role': {
            const userId = getStringParam(params, 'user_id');
            const role = normalizeRole(params.p_role);
            return admin
                .from('user_profiles')
                .update({ role, is_admin: role === 'admin' || role === 'master' })
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'update_user_organization': {
            const userId = getStringParam(params, 'p_user_id');
            const organizationId = getStringParam(params, 'p_organization_id');
            return admin
                .from('user_profiles')
                .update({ organization_id: organizationId || null })
                .eq('id', userId)
                .select('id')
                .single();
        }
        case 'list_all_organizations': {
            const { data, error } = await admin
                .from('organizations')
                .select('id, name, slug, max_users, is_active, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (error) return { data: null, error };

            const { data: users, error: usersError } = await admin
                .from('user_profiles')
                .select('organization_id');

            if (usersError) return { data: null, error: usersError };

            const counts = new Map<string, number>();
            (users || []).forEach((user) => {
                if (user.organization_id) counts.set(user.organization_id, (counts.get(user.organization_id) || 0) + 1);
            });

            return {
                data: (data || []).map((org) => ({ ...org, user_count: counts.get(org.id) || 0 })),
                error: null
            };
        }
        case 'create_organization': {
            const name = getStringParam(params, 'p_name').trim();
            const slug = getStringParam(params, 'p_slug').trim().toLowerCase();
            const maxUsers = Number(params.p_max_users || 10);
            assertValidSlug(slug);

            const { data: existing, error: existingError } = await admin
                .from('organizations')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (existingError) return { data: null, error: existingError };
            if (existing) throw new Error('Slug ja existe. Escolha outro.');

            const { data, error } = await admin
                .from('organizations')
                .insert({ name, slug, max_users: maxUsers, is_active: true })
                .select('id')
                .single();

            return { data: data?.id || null, error };
        }
        case 'update_organization': {
            const id = getStringParam(params, 'p_id');
            const updates: Record<string, unknown> = {};

            if (typeof params.p_name === 'string') updates.name = params.p_name.trim();
            if (typeof params.p_slug === 'string') {
                const slug = params.p_slug.trim().toLowerCase();
                assertValidSlug(slug);

                const { data: existing, error: existingError } = await admin
                    .from('organizations')
                    .select('id')
                    .eq('slug', slug)
                    .neq('id', id)
                    .maybeSingle();

                if (existingError) return { data: null, error: existingError };
                if (existing) throw new Error('Slug ja existe. Escolha outro.');
                updates.slug = slug;
            }
            if (typeof params.p_max_users === 'number') updates.max_users = params.p_max_users;
            if (typeof params.p_is_active === 'boolean') updates.is_active = params.p_is_active;
            updates.updated_at = new Date().toISOString();

            const { error } = await admin
                .from('organizations')
                .update(updates)
                .eq('id', id);

            return { data: !error, error };
        }
        default:
            return { data: null, error: { message: 'RPC administrativa nao implementada.' } };
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ data: null, error: 'Usuario nao autenticado.' }, { status: 401 });
        }

        const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');
        const profile = normalizeProfile(profileData);

        if (profileError || !profile || !canUseAdminApi(profile)) {
            return NextResponse.json({ data: null, error: 'Usuario sem permissao administrativa.' }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const rpcName = typeof body?.rpcName === 'string' ? body.rpcName : '';
        const params = body?.params && typeof body.params === 'object' ? body.params : {};

        if (!ADMIN_RPC_ALLOWLIST.has(rpcName)) {
            return NextResponse.json({ data: null, error: 'RPC administrativa nao permitida.' }, { status: 400 });
        }

        const { data, error } = await executeAdminOperation(rpcName, params, profile);

        if (error) {
            return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ data, error: null });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido na API administrativa.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
