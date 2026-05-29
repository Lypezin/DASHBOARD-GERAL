import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { useAuthState } from '@/hooks/upload-auth/useAuthState';
import { checkAdminStatus } from '@/hooks/upload-auth/checkAuth';

const AUTH_TIMEOUT = 10000;

export function useUploadAuth() {
  const router = useRouter();
  const {
    loading,
    setLoading,
    isAuthorized,
    setIsAuthorized,
    user,
    setUser,
    errorMessage,
    setErrorMessage,
    isMountedRef,
    timeoutRef
  } = useAuthState();

  useEffect(() => {
    const performAuthCheck = async () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }

        safeLog.error('Timeout na verificação de autenticação');
        setLoading(false);
        setIsAuthorized(false);
        setErrorMessage('Não foi possível validar o acesso ao upload dentro do tempo esperado.');
      }, AUTH_TIMEOUT);

      const result = await checkAdminStatus();

      if (!isMountedRef.current) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (result.error) {
        setLoading(false);
        setIsAuthorized(false);
        setErrorMessage('Não foi possível validar suas permissões de upload agora.');
        return;
      }

      if (result.redirect) {
        setLoading(false);
        router.push(result.redirect);
        return;
      }

      if (result.user) {
        setUser(result.user);
      }

      setIsAuthorized(result.authorized);
      setErrorMessage(result.authorized ? null : 'Você não possui permissão para acessar a área de upload.');
      setLoading(false);
    };

    void performAuthCheck();
  }, [router, setErrorMessage, setIsAuthorized, setLoading, setUser, timeoutRef, isMountedRef]);

  return { loading, isAuthorized, user, errorMessage };
}
