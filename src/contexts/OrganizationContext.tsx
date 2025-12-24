
'use client';

import React, { createContext, useContext } from 'react';
import { useOrganizationFetcher } from './hooks/useOrganizationFetcher';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { organization, isLoading, error, refreshOrganization } = useOrganizationFetcher();

  const value = React.useMemo<OrganizationContextType>(() => ({
    organization,
    organizationId: organization?.id || null,
    isLoading,
    error,
    refreshOrganization: async () => { await refreshOrganization(); },
  }), [organization, isLoading, error, refreshOrganization]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization deve ser usado dentro de OrganizationProvider');
  }
  return context;
}
