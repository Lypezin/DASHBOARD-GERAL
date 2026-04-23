import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/auth/useAuthGuard';
import { CurrentUser } from '@/types';

function areSameCurrentUser(prevUser: CurrentUser | null, nextUser: CurrentUser | null) {
    if (prevUser === nextUser) return true;
    if (!prevUser || !nextUser) return false;

    if (
        prevUser.id !== nextUser.id ||
        prevUser.is_admin !== nextUser.is_admin ||
        prevUser.role !== nextUser.role ||
        prevUser.organization_id !== nextUser.organization_id
    ) {
        return false;
    }

    if (prevUser.assigned_pracas.length !== nextUser.assigned_pracas.length) {
        return false;
    }

    return prevUser.assigned_pracas.every((praca, index) => praca === nextUser.assigned_pracas[index]);
}

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
                if (areSameCurrentUser(prevUser, authUser)) {
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
