import { useState, useEffect, useCallback } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export interface OrganizationFormData {
  name: string;
  slug: string;
  max_users: number;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await safeRpc<Organization[]>('list_all_organizations', {}, {
        timeout: 30000,
        validateParams: false
      });

      if (rpcError) {
        throw new Error(rpcError.message || 'Erro ao buscar organizações');
      }

      setOrganizations(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar organizações';
      if (IS_DEV) {
        safeLog.error('[useOrganizations] Erro:', err);
      }
      setError(errorMessage);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = useCallback(async (formData: OrganizationFormData): Promise<{ success: boolean; error?: string; id?: string }> => {
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

      await fetchOrganizations();
      return { success: true, id: data || undefined };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar organização';
      if (IS_DEV) {
        safeLog.error('[useOrganizations] Erro ao criar:', err);
      }
      return { success: false, error: errorMessage };
    }
  }, [fetchOrganizations]);

  const updateOrganization = useCallback(async (
    id: string,
    updates: Partial<OrganizationFormData & { is_active?: boolean }>
  ): Promise<{ success: boolean; error?: string }> => {
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

      await fetchOrganizations();
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar organização';
      if (IS_DEV) {
        safeLog.error('[useOrganizations] Erro ao atualizar:', err);
      }
      return { success: false, error: errorMessage };
    }
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
  };
}

