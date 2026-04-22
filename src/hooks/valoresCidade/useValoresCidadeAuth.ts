import { useEffect, useState } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { hasFullCityAccess, type CurrentUser } from '@/types';

interface ValoresCidadeProfile extends CurrentUser {
  is_approved: boolean;
}

export const useValoresCidadeAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const validateAccess = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const { data: profile, error } = await safeRpc<ValoresCidadeProfile>('get_current_user_profile', {}, {
          timeout: 10000,
          validateParams: false,
        });

        if (!mounted) {
          return;
        }

        if (error || !profile) {
          setIsAuthenticated(false);
          setErrorMessage('Não foi possível validar suas permissões no momento.');
          return;
        }

        if (!profile.is_approved) {
          setIsAuthenticated(false);
          setErrorMessage('Seu acesso ainda não foi aprovado.');
          return;
        }

        if (!hasFullCityAccess(profile)) {
          setIsAuthenticated(false);
          setErrorMessage('Acesso restrito a perfis com permissão ampliada de cidades.');
          return;
        }

        setIsAuthenticated(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void validateAccess();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isAuthenticated,
    loading,
    errorMessage,
  };
};
