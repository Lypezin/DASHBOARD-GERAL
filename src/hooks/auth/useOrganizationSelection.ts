import { useState, useEffect, useRef, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';

interface Organization {
    id: string;
    name: string;
}

export function useOrganizationSelection(isAuthorized: boolean, user: { id: string } | null) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
    const hasManualSelectionRef = useRef(false);

    useEffect(() => {
        if (!isAuthorized || !user?.id) {
            setOrganizations([]);
            setSelectedOrgId('');
            hasManualSelectionRef.current = false;
            return;
        }

        const fetchOrgs = async () => {
            setIsLoadingOrgs(true);
            try {
                const { data: isGlobal } = await supabase.rpc('is_global_admin');

                if (!isGlobal) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('organization_id')
                        .eq('id', user.id)
                        .single();

                    if (profile?.organization_id) {
                        setSelectedOrgId(profile.organization_id);
                    }

                    setOrganizations([]);
                    hasManualSelectionRef.current = false;
                    return;
                }

                const { data } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .order('name');

                if (!data) return;

                setOrganizations(data);

                setSelectedOrgId((current) => {
                    if (hasManualSelectionRef.current && current && data.some((org) => org.id === current)) {
                        return current;
                    }

                    if (data.length > 0) {
                        hasManualSelectionRef.current = false;
                        return data[0].id;
                    }

                    return '';
                });
            } catch (error) {
                safeLog.error('Erro ao carregar organizacoes:', error);
            } finally {
                setIsLoadingOrgs(false);
            }
        };

        void fetchOrgs();
    }, [isAuthorized, user?.id]);

    const handleSelectedOrgIdChange = useCallback((value: string) => {
        hasManualSelectionRef.current = true;
        setSelectedOrgId(value);
    }, []);

    return {
        organizations,
        selectedOrgId,
        setSelectedOrgId: handleSelectedOrgIdChange,
        isLoadingOrgs
    };
}
