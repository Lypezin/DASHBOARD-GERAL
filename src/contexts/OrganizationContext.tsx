'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // Obter organization_id do user_metadata
      const organizationId = user.user_metadata?.organization_id as string | undefined;

      if (!organizationId) {
        if (IS_DEV) {
          safeLog.warn('[OrganizationContext] Usuário não tem organization_id no user_metadata');
        }
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // Buscar dados da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, max_users, is_active, created_at, updated_at')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        throw new Error(`Erro ao buscar organização: ${orgError.message}`);
      }

      if (orgData) {
        setOrganization(orgData as Organization);
      } else {
        setOrganization(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar organização';
      if (IS_DEV) {
        safeLog.error('[OrganizationContext] Erro:', err);
      }
      setError(errorMessage);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganization();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchOrganization();
      } else if (event === 'SIGNED_OUT') {
        setOrganization(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrganization]);

  const refreshOrganization = useCallback(async () => {
    await fetchOrganization();
  }, [fetchOrganization]);

  const value: OrganizationContextType = {
    organization,
    organizationId: organization?.id || null,
    isLoading,
    error,
    refreshOrganization,
  };

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

