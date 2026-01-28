import { useAuthGuard } from '@/hooks/useAuthGuard';
import { CurrentUser } from '@/types';

export function useAuth() {
    const { currentUser, isAuthenticated, isChecking } = useAuthGuard({
        requireApproval: false,
        fetchUserProfile: true,
    });

    return {
        user: currentUser,
        isAuthenticated,
        loading: isChecking,
    };
}
