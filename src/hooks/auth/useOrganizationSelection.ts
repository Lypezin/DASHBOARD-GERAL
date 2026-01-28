import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { CurrentUser } from '@/types';

interface Organization {
    id: string;
    name: string;
}

export function useOrganizationSelection(isAuthorized: boolean, user: { id: string } | null) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

    useEffect(() => {
        if (isAuthorized && user?.id) {
            const fetchOrgs = async () => {
                setIsLoadingOrgs(true);
                try {
                    // Verificar se é admin global primeiro
                    const { data: isGlobal } = await supabase.rpc('is_global_admin');

                    if (!isGlobal) {
                        // Se não for global, definir apenas a organização do usuário e não carregar lista
                        const { data: profile } = await supabase
                            .from('user_profiles')
                            .select('organization_id')
                            .eq('id', user.id)
                            .single();

                        if (profile?.organization_id) {
                            setSelectedOrgId(profile.organization_id);
                        }
                        setOrganizations([]); // Não mostrar lista
                        return;
                    }

                    // Se for global, carregar lista
                    const { data, error } = await supabase
                        .from('organizations')
                        .select('id, name')
                        .order('name');

                    if (data) {
                        setOrganizations(data);
                        // Tentar selecionar a organização do usuário atual como padrão
                        const { data: profile } = await supabase
                            .from('user_profiles')
                            .select('organization_id')
                            .eq('id', user.id)
                            .single();

                        if (profile?.organization_id) {
                            setSelectedOrgId(profile.organization_id);
                        } else if (data.length > 0) {
                            setSelectedOrgId(data[0].id);
                        }
                    }
                } catch (error) {
                    safeLog.error('Erro ao carregar organizações:', error);
                } finally {
                    setIsLoadingOrgs(false);
                }
            };

            fetchOrgs();
        }
    }, [isAuthorized, user]);

    return {
        organizations,
        selectedOrgId,
        setSelectedOrgId,
        isLoadingOrgs
    };
}
