import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export function useDashboardAuthWrapper() {
    const { currentUser, isAuthenticated, isLoading, hasResolved, error, refresh, profile } = useAppBootstrap();
    const hasSessionWithoutProfile = isAuthenticated && hasResolved && !currentUser;
    const hasMissingOrganization = isAuthenticated && hasResolved && !!currentUser && !currentUser.organization_id;
    const accessError = hasSessionWithoutProfile
        ? profile?.is_approved === false
            ? 'Seu cadastro foi criado, mas ainda precisa ser aprovado por um administrador antes de acessar o dashboard.'
            : error || 'Não foi possível carregar seu perfil. Tente atualizar a sessão.'
        : hasMissingOrganization
            ? 'Seu usuário está aprovado, mas ainda não possui uma organização vinculada. Ajuste isso no Admin antes de acessar a dashboard.'
            : error;

    return {
        isCheckingAuth: isLoading && !hasResolved,
        isAuthenticated: isAuthenticated && !!currentUser,
        hasSessionWithoutProfile,
        hasMissingOrganization,
        error: accessError,
        refresh,
        currentUser
    };
}
