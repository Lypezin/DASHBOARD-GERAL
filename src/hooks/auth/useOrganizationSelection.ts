import { useState, useEffect, useRef, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';

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

        let cancelled = false;

        const fetchOrgs = async () => {
            setIsLoadingOrgs(true);
            try {
                const { data, error } = await getAppApiData<{
                    isGlobal: boolean;
                    organizationId: string;
                    organizations: Organization[];
                }>('/api/app/organization-selection');

                if (cancelled) return;

                if (error || !data) {
                    safeLog.error('Erro ao carregar organizacoes:', error || 'Resposta vazia');
                    return;
                }

                if (!data.isGlobal) {
                    if (data.organizationId) {
                        setSelectedOrgId(data.organizationId);
                    }

                    setOrganizations([]);
                    hasManualSelectionRef.current = false;
                    return;
                }

                setOrganizations(data.organizations);

                setSelectedOrgId((current) => {
                    if (hasManualSelectionRef.current && current && data.organizations.some((org) => org.id === current)) {
                        return current;
                    }

                    if (data.organizations.length > 0) {
                        hasManualSelectionRef.current = false;
                        return data.organizations[0].id;
                    }

                    return '';
                });
            } catch (error) {
                if (!cancelled) {
                    safeLog.error('Erro ao carregar organizacoes:', error);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingOrgs(false);
                }
            }
        };

        void fetchOrgs();

        return () => {
            cancelled = true;
        };
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
