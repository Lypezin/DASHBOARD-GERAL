import { useState, useEffect, useCallback } from 'react';
import { fetchAllOrganizations, createNewOrganization, updateExistingOrganization } from '@/services/organizationService';

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

export interface OrganizationOperationResult {
  success: boolean;
  error?: string;
  id?: string;
}

export function useOrganizations(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: serviceError } = await fetchAllOrganizations();

    if (serviceError) {
      setError(serviceError);
      setOrganizations([]);
    } else {
      setOrganizations(data || []);
    }
    setLoading(false);
  }, [enabled]);

  const createOrganization = useCallback(async (formData: OrganizationFormData): Promise<OrganizationOperationResult> => { // Updated return type
    const result = await createNewOrganization(formData);
    if (result.success) {
      await fetchOrganizations();
    }
    return result;
  }, [fetchOrganizations]);

  const updateOrganization = useCallback(async (
    id: string,
    updates: Partial<OrganizationFormData & { is_active?: boolean }>
  ): Promise<OrganizationOperationResult> => { // Updated return type
    const result = await updateExistingOrganization(id, updates);
    if (result.success) {
      await fetchOrganizations();
    }
    return result;
  }, [fetchOrganizations]);

  useEffect(() => {
    if (enabled) {
      fetchOrganizations();
      return;
    }

    setOrganizations([]);
    setError(null);
    setLoading(false);
  }, [enabled, fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
  };
}

