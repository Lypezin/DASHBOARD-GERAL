import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export function useDashboardAuthWrapper() {
    const { currentUser, isAuthenticated, isLoading, hasResolved } = useAppBootstrap();

    return {
        isCheckingAuth: isLoading && !hasResolved,
        isAuthenticated: isAuthenticated && !!currentUser,
        currentUser
    };
}
