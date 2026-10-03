import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { adminRpc } from '@/services/adminRpcClient';
import { fetchPracasWithFallback } from '@/hooks/admin/utils/pracasFetcher';
import { postAppApiData } from '@/utils/app/fetchAppApi';
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
      const [usersPromise, pendingPromise, pracasPromise] = await Promise.allSettled([
        adminRpc<User[]>('list_all_users'),
        adminRpc<User[]>('list_pending_users'),
        fetchPracasWithFallback(),
      ]);

      const usersLoaded = usersPromise.status === 'fulfilled'
        && !usersPromise.value.error
        && Array.isArray(usersPromise.value.data);
      const pendingLoaded = pendingPromise.status === 'fulfilled'
        && !pendingPromise.value.error
        && Array.isArray(pendingPromise.value.data);
      const pracasLoaded = pracasPromise.status === 'fulfilled';
      const rawUsers = usersLoaded ? usersPromise.value.data ?? [] : [];
      const rawPendingUsers = pendingLoaded ? pendingPromise.value.data ?? [] : [];
      const failures: string[] = [];
      const avatarIds = Array.from(new Set([...rawUsers, ...rawPendingUsers].map((user) => user.id).filter(Boolean)));
      const profilesMap = new Map<string, string>();

      if (avatarIds.length > 0) {
        const { data: profiles } = await postAppApiData<Array<{ id: string; avatar_url: string | null }>>('/api/profile/avatars', {
          ids: avatarIds,
        });
        profiles?.forEach((profile) => {
          if (profile.avatar_url) profilesMap.set(profile.id, profile.avatar_url);
        });
      }

      if (usersLoaded) {
        setUsers(rawUsers.map(u => ({ ...u, avatar_url: profilesMap.get(u.id) || u.avatar_url })));
      } else {
        failures.push('usuários');
        if (IS_DEV) safeLog.warn('Erro ao buscar usuários:', usersPromise.status === 'fulfilled' ? usersPromise.value.error : 'Erro desconhecido');
      }

      if (pendingLoaded) {
        setPendingUsers(rawPendingUsers.map(u => ({ ...u, avatar_url: profilesMap.get(u.id) || u.avatar_url })));
      } else {
        failures.push('usuários pendentes');
        if (IS_DEV) safeLog.warn('Erro ao buscar usuários pendentes:', pendingPromise.status === 'fulfilled' ? pendingPromise.value.error : 'Erro desconhecido');
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
