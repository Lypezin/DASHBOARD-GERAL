import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { useAuthState } from './upload-auth/useAuthState';
import { checkAdminStatus } from './upload-auth/checkAuth';

const AUTH_TIMEOUT = 10000;
const MAX_RETRIES = 2;

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
    retryCountRef,
    timeoutRef
  } = useAuthState();

  useEffect(() => {
    const performAuthCheck = async () => {
      // Limpar timeout anterior
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Timeout de segurança
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          safeLog.error('Timeout na verificação de autenticação');
          setLoading(false);
          setIsAuthorized(false);
          handleRetry();
        }
      }, AUTH_TIMEOUT);

      const result = await checkAdminStatus();

      if (!isMountedRef.current) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (result.error) {
        setLoading(false);
        setIsAuthorized(false);
        handleRetry();
        return;
      }

      if (result.redirect) {
        router.push(result.redirect);
        return;
      }

      if (result.user) setUser(result.user);
      setIsAuthorized(result.authorized);
      setLoading(false);
    };

    const handleRetry = () => {
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(() => {
          if (isMountedRef.current) {
            window.location.reload();
          }
        }, 2000);
      }
    };

    performAuthCheck();
  }, [router]);

  return { loading, isAuthorized, user };
}
