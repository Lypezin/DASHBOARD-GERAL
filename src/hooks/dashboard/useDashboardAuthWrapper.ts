import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export function useDashboardAuthWrapper() {
    const { currentUser, isAuthenticated, isLoading, hasResolved, error, refresh } = useAppBootstrap();

    return {
        isCheckingAuth: isLoading && !hasResolved,
        isAuthenticated: isAuthenticated && !!currentUser,
        hasSessionWithoutProfile: isAuthenticated && hasResolved && !currentUser,
        error,
        refresh,
        currentUser
    };
}
