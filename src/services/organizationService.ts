
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { Organization, OrganizationFormData, OrganizationOperationResult } from '@/hooks/auth/useOrganizations';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchAllOrganizations(): Promise<{ data: Organization[] | null, error: string | null }> {
    try {
        const { data, error: rpcError } = await safeRpc<Organization[]>('list_all_organizations', {}, {
            timeout: 30000,
            validateParams: false
        });

        if (rpcError) {
            return { data: null, error: rpcError.message || 'Erro ao buscar organizações' };
        }

        return { data: data || [], error: null };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar organizações';
        if (IS_DEV) safeLog.error('[organizationService] Erro:', err);
        return { data: null, error: errorMessage };
    }
}

export async function createNewOrganization(formData: OrganizationFormData): Promise<OrganizationOperationResult> {
    try {
        const { data, error: rpcError } = await safeRpc<string>('create_organization', {
            p_name: formData.name.trim(),
            p_slug: formData.slug.trim().toLowerCase(),
            p_max_users: formData.max_users
        }, {
            timeout: 30000,
            validateParams: false
        });

        if (rpcError) {
            return { success: false, error: rpcError.message || 'Erro ao criar organização' };
        }

        return { success: true, id: data || undefined };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar organização';
        if (IS_DEV) safeLog.error('[organizationService] Erro ao criar:', err);
        return { success: false, error: errorMessage };
    }
}

export async function updateExistingOrganization(
    id: string,
    updates: Partial<OrganizationFormData & { is_active?: boolean }>
): Promise<OrganizationOperationResult> {
    try {
        const { error: rpcError } = await safeRpc<boolean>('update_organization', {
            p_id: id,
            p_name: updates.name?.trim(),
            p_slug: updates.slug?.trim().toLowerCase(),
            p_max_users: updates.max_users,
            p_is_active: updates.is_active
        }, {
            timeout: 30000,
            validateParams: false
        });

        if (rpcError) {
            return { success: false, error: rpcError.message || 'Erro ao atualizar organização' };
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar organização';
        if (IS_DEV) safeLog.error('[organizationService] Erro ao atualizar:', err);
        return { success: false, error: errorMessage };
    }
}
