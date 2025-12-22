import { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { fetchPracasWithFallback } from './admin/utils/pracasFetcher';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  assigned_pracas: string[];
  role?: 'admin' | 'marketing' | 'user' | 'master';
  created_at: string;
  approved_at: string | null;
  organization_id?: string | null;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  is_admin: boolean;
  is_approved: boolean;
}

export function useAdminData() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pracasDisponiveis, setPracasDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersPromise, pendingPromise, pracasPromise] = await Promise.allSettled([
        safeRpc<User[]>('list_all_users', {}, { timeout: 30000, validateParams: false }),
        safeRpc<User[]>('list_pending_users', {}, { timeout: 30000, validateParams: false }),
        fetchPracasWithFallback()
      ]);

      if (usersPromise.status === 'fulfilled' && !usersPromise.value.error) {
        setUsers(usersPromise.value.data || []);
      } else {
        if (IS_DEV) {
          const errorMsg = usersPromise.status === 'fulfilled'
            ? usersPromise.value.error
            : usersPromise.status === 'rejected'
              ? usersPromise.reason
              : 'Erro desconhecido';
          safeLog.warn('Erro ao buscar usuários:', errorMsg);
        }
        setUsers([]);
      }

      if (pendingPromise.status === 'fulfilled' && !pendingPromise.value.error) {
        setPendingUsers(pendingPromise.value.data || []);
      } else {
        if (IS_DEV) {
          const errorMsg = pendingPromise.status === 'fulfilled'
            ? pendingPromise.value.error
            : pendingPromise.status === 'rejected'
              ? pendingPromise.reason
              : 'Erro desconhecido';
          safeLog.warn('Erro ao buscar usuários pendentes:', errorMsg);
        }
        setPendingUsers([]);
      }

      if (pracasPromise.status === 'fulfilled') {
        setPracasDisponiveis(pracasPromise.value);
      } else {
        if (IS_DEV) {
          const errorMsg = pracasPromise.status === 'rejected'
            ? pracasPromise.reason
            : 'Erro desconhecido';
          safeLog.warn('Erro ao buscar praças:', errorMsg);
        }
        setPracasDisponiveis([]);
      }
    } catch (err: any) {
      if (IS_DEV) safeLog.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    pendingUsers,
    pracasDisponiveis,
    loading,
    error,
    fetchData,
  };
}
