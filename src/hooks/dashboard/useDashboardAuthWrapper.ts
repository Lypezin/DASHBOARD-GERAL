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
            setCurrentUser(prevUser => {
                // Previne re-renders massivos do Dashboard caso o AuthFlow (background sync do supabase)
                // injete um novo objeto com os EXATOS mesmos dados. Isso salva o React.memo() lá na ponta.
                if (JSON.stringify(prevUser) === JSON.stringify(authUser)) {
                    return prevUser;
                }
                return authUser;
            });
        }
    }, [authUser]);

    return {
        isCheckingAuth,
        isAuthenticated,
        currentUser
    };
}
