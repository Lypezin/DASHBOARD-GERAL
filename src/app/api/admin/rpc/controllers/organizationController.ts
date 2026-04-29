import { SupabaseClient } from '@supabase/supabase-js';

export function getStringParam(params: Record<string, unknown>, key: string) {
    const value = params[key];
    return typeof value === 'string' ? value : '';
}

function assertValidSlug(slug: string) {
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('Slug invalido. Use apenas letras minusculas, numeros e hifens.');
    }
}

export async function listAllOrganizations(admin: SupabaseClient) {
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

export async function createOrganization(admin: SupabaseClient, params: Record<string, unknown>) {
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

export async function updateOrganization(admin: SupabaseClient, params: Record<string, unknown>) {
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
