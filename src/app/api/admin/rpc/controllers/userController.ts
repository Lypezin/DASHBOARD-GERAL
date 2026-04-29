import { SupabaseClient } from '@supabase/supabase-js';

export function normalizeRole(role: unknown) {
    const value = typeof role === 'string' && role ? role : 'user';
    if (!['admin', 'marketing', 'user', 'master'].includes(value)) {
        throw new Error('Role invalido. Use admin, marketing, master ou user.');
    }
    return value as 'admin' | 'marketing' | 'user' | 'master';
}

export function buildUserUpdate(params: Record<string, unknown>, approvedBy?: string | null, approve = false) {
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

export function getStringParam(params: Record<string, unknown>, key: string) {
    const value = params[key];
    return typeof value === 'string' ? value : '';
}

export async function listAllUsers(admin: SupabaseClient) {
    return admin
        .from('user_profiles')
        .select('id, full_name, email, role, is_admin, is_approved, created_at, approved_at, organization_id, assigned_pracas, avatar_url')
        .order('created_at', { ascending: false });
}

export async function listPendingUsers(admin: SupabaseClient) {
    return admin
        .from('user_profiles')
        .select('id, full_name, email, role, is_admin, is_approved, created_at, approved_at, organization_id, assigned_pracas, avatar_url')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
}

export async function approveUser(admin: SupabaseClient, params: Record<string, unknown>, profileId: string | null) {
    const userId = getStringParam(params, 'user_id');
    return admin
        .from('user_profiles')
        .update(buildUserUpdate(params, profileId, true))
        .eq('id', userId)
        .select('id')
        .single();
}

export async function updateUserPracas(admin: SupabaseClient, params: Record<string, unknown>) {
    const userId = getStringParam(params, 'user_id');
    return admin
        .from('user_profiles')
        .update(buildUserUpdate(params, null, false))
        .eq('id', userId)
        .select('id')
        .single();
}

export async function revokeUserAccess(admin: SupabaseClient, params: Record<string, unknown>) {
    const userId = getStringParam(params, 'user_id');
    return admin
        .from('user_profiles')
        .update({ is_approved: false, status: 'pending', role: 'user', is_admin: false, assigned_pracas: [] })
        .eq('id', userId)
        .select('id')
        .single();
}

export async function setUserAdmin(admin: SupabaseClient, params: Record<string, unknown>, profileId: string | undefined) {
    const userId = getStringParam(params, 'user_id');
    const makeAdmin = params.make_admin === true;

    if (userId === profileId && !makeAdmin) {
        throw new Error('Voce nao pode remover seu proprio status de admin.');
    }

    return admin
        .from('user_profiles')
        .update({ is_admin: makeAdmin, role: makeAdmin ? 'admin' : 'user', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id')
        .single();
}

export async function updateUserRole(admin: SupabaseClient, params: Record<string, unknown>) {
    const userId = getStringParam(params, 'user_id');
    const role = normalizeRole(params.p_role);
    return admin
        .from('user_profiles')
        .update({ role, is_admin: role === 'admin' || role === 'master' })
        .eq('id', userId)
        .select('id')
        .single();
}

export async function updateUserOrganization(admin: SupabaseClient, params: Record<string, unknown>) {
    const userId = getStringParam(params, 'p_user_id');
    const organizationId = getStringParam(params, 'p_organization_id');
    return admin
        .from('user_profiles')
        .update({ organization_id: organizationId || null })
        .eq('id', userId)
        .select('id')
        .single();
}
