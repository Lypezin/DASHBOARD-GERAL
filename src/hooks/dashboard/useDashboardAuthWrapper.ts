import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/auth/useAuthGuard';
import { CurrentUser } from '@/types';

export function useDashboardAuthWrapper() {
    const { isChecking: isCheckingAuth, isAuthenticated, currentUser: authUser } = useAuthGuard({
        requireApproval: true,
        fetchUserProfile: true,
    });

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(authUser || null);

    // Atualizar currentUser quando authUser mudar
    useEffect(() => {
        if (authUser) {
            setCurrentUser(authUser);
        }
    }, [authUser]);

    return {
        isCheckingAuth,
        isAuthenticated,
        currentUser
    };
}
