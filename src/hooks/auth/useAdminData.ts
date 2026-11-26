import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { adminRpc } from '@/services/adminRpcClient';
import { fetchPracasWithFallback } from '@/hooks/admin/utils/pracasFetcher';
import { IS_DEV } from '@/constants/environment';


export interface User {
  id: string; full_name: string; email: string; is_admin: boolean; is_approved: boolean;
  assigned_pracas: string[]; role?: 'admin' | 'marketing' | 'user' | 'master';
  created_at: string; approved_at: string | null; organization_id?: string | null; avatar_url?: string;
}
export function useAdminData() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pracasDisponiveis, setPracasDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersPromise, pracasPromise] = await Promise.allSettled([
        adminRpc<User[]>('list_all_users'),
        fetchPracasWithFallback(),
      ]);

      const usersLoaded = usersPromise.status === 'fulfilled'
        && !usersPromise.value.error
        && Array.isArray(usersPromise.value.data);
      const pracasLoaded = pracasPromise.status === 'fulfilled';
      const rawUsers = usersLoaded ? usersPromise.value.data ?? [] : [];
      const failures: string[] = [];

      if (usersLoaded) {
        setUsers(rawUsers);
        setPendingUsers(rawUsers.filter((user) => !user.is_approved));
      } else {
        failures.push('usuários');
        if (IS_DEV) safeLog.warn('Erro ao buscar usuários:', usersPromise.status === 'fulfilled' ? usersPromise.value.error : 'Erro desconhecido');
      }

      if (pracasLoaded) setPracasDisponiveis(pracasPromise.value);
      else {
        failures.push('praças');
        if (IS_DEV) safeLog.warn('Erro ao buscar praças:', pracasPromise.status === 'rejected' ? pracasPromise.reason : 'Erro desconhecido');
      }

      setError(failures.length > 0
        ? `Não foi possível atualizar: ${failures.join(', ')}. Os últimos dados disponíveis foram mantidos; tente novamente.`
        : null);
    } catch (err: unknown) {
      if (IS_DEV) safeLog.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, pendingUsers, pracasDisponiveis, loading, error, fetchData };
}
