import { useEffect, useState } from 'react';
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
    isMountedRef,
    timeoutRef
  } = useAuthState();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const performAuthCheck = async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          safeLog.error('Timeout na verificação de autenticação');
          setLoading(false);
          setIsAuthorized(false);
          setErrorMessage('Não foi possível validar o acesso ao upload dentro do tempo esperado.');
        }
      }, AUTH_TIMEOUT);

      const result = await checkAdminStatus();

      if (!isMountedRef.current) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (result.error) {
        setLoading(false);
        setIsAuthorized(false);
        setErrorMessage('Não foi possível validar suas permissões de upload agora.');
        return;
      }

      if (result.redirect) {
        router.push(result.redirect);
        return;
      }

      if (result.user) setUser(result.user);
      setIsAuthorized(result.authorized);
      setErrorMessage(result.authorized ? null : 'Você não possui permissão para acessar a área de upload.');
      setLoading(false);
    };

    performAuthCheck();
  }, [router]);

  return { loading, isAuthorized, user, errorMessage };
}
