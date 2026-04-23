import { supabase } from '@/lib/supabaseClient';
import { Organization } from '@/contexts/OrganizationContext';

export async function fetchOrganizationData(organizationId: string): Promise<Organization | null> {
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, max_users, is_active, created_at, updated_at')
        .eq('id', organizationId)
        .maybeSingle();

    if (orgError) {
        throw new Error(`Erro ao buscar organização: ${orgError.message}`);
    }

    return orgData as Organization;
}
