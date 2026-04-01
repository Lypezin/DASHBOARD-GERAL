
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Organization } from '@/contexts/OrganizationContext';
import { fetchOrganizationData } from './organizationDataHelper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useOrganizationFetcher() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrganization = useCallback(async () => {
        try {
            // Só ativar a flag destrutiva de loading se for a primeira vez
            setOrganization(prev => {
                if (!prev) setIsLoading(true);
                return prev;
            });
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
            const orgData = await fetchOrganizationData(organizationId);

            if (orgData) {
                // Only update if data actually changed to avoid re-renders
                setOrganization(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(orgData)) return prev;
                    return orgData;
                });
            } else {
                setOrganization(null);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar organização';
            if (IS_DEV) {
                safeLog.error('[OrganizationContext] Erro:', err);
            }
            setError(errorMessage);
            setOrganization(null);
        } finally {
            // Garantir que o falso venha sempre
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrganization();

        // Escutar mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Ignorar TOKEN_REFRESHED para evitar reloads desnecessários na tela
            // Dados da organização não mudam com o refresh do token
            if (event === 'SIGNED_IN') {
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

    return {
        organization,
        isLoading,
        error,
        refreshOrganization: fetchOrganization
    };
}
