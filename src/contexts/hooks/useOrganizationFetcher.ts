import { useCallback } from 'react';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export function useOrganizationFetcher() {
    const { organization, isLoading, error, refresh } = useAppBootstrap();

    const refreshOrganization = useCallback(async () => {
        await refresh(true);
    }, [refresh]);

    return {
        organization,
        isLoading,
        error,
        refreshOrganization
    };
}
