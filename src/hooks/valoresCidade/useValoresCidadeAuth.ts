import { useMemo } from 'react';
import { hasFullCityAccess } from '@/types';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';

export const useValoresCidadeAuth = () => {
  const { currentUser, profile, hasResolved, isLoading } = useAppBootstrap();

  const errorMessage = useMemo(() => {
    if (!hasResolved) return null;
    if (!profile) return 'Não foi possível validar suas permissões no momento.';
    if (profile.is_approved === false) return 'Seu acesso ainda não foi aprovado.';
    if (!hasFullCityAccess(currentUser)) return 'Acesso restrito a perfis com permissão ampliada de cidades.';
    return null;
  }, [currentUser, hasResolved, profile]);

  return {
    isAuthenticated: hasResolved && !!profile && profile.is_approved !== false && hasFullCityAccess(currentUser),
    loading: isLoading || !hasResolved,
    errorMessage,
  };
};
