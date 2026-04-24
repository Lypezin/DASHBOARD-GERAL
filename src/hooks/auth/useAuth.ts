import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export function useAuth() {
    const { currentUser, isAuthenticated, isLoading } = useAppBootstrap();

    return {
        user: currentUser,
        isAuthenticated: isAuthenticated && !!currentUser,
        loading: isLoading,
    };
}
