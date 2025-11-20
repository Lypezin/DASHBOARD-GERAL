/**
 * Hook customizado para verificar autenticação e permissões de admin na página de upload
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface UserProfile {
  is_admin: boolean;
  is_approved: boolean;
}

/**
 * Hook para verificar se o usuário está autenticado e é admin
 * @returns Objeto com loading, isAuthorized e user
 */
export function useUploadAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se o usuário está autenticado
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push('/login');
          return;
        }

        setUser(authUser);

        // Verificar se é admin
        const { data: profile, error } = await supabase
          .rpc('get_current_user_profile') as { data: UserProfile | null; error: any };

        if (error) {
          safeLog.error('Erro ao verificar perfil do usuário:', error);
          router.push('/');
          return;
        }

        if (!profile?.is_admin) {
          // Usuário não é admin - redirecionar para página principal
          router.push('/');
          return;
        }

        // Verificar se está aprovado
        if (!profile?.is_approved) {
          router.push('/login');
          return;
        }

        // Usuário autorizado
        setIsAuthorized(true);
      } catch (err) {
        safeLog.error('Erro ao verificar autenticação:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { loading, isAuthorized, user };
}

