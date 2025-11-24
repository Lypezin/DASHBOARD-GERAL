import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  assigned_pracas: string[];
  role?: 'admin' | 'marketing' | 'user';
  created_at: string;
  approved_at: string | null;
  organization_id?: string | null;
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

  const fetchPracasWithFallback = async (): Promise<string[]> => {
    const cachedPracas = sessionStorage.getItem('admin_pracas_cache');
    const cacheTime = sessionStorage.getItem('admin_pracas_cache_time');
    
    if (cachedPracas && cacheTime) {
      const now = Date.now();
      const cached = parseInt(cacheTime);
      if (now - cached < 5 * 60 * 1000) {
        return JSON.parse(cachedPracas);
      }
    }

    try {
      const { data: pracasData, error: pracasError } = await safeRpc<string[]>('list_pracas_disponiveis', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (!pracasError && pracasData && pracasData.length > 0) {
        const pracas = pracasData.map((p: any) => p.praca).filter(Boolean);
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(pracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return pracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.warn('Função list_pracas_disponiveis falhou, tentando fallback:', err);
    }

    try {
      const { data: mvPracas, error: mvError } = await supabase
        .from('mv_aderencia_agregada')
        .select('praca')
        .not('praca', 'is', null)
        .order('praca');
      
      if (!mvError && mvPracas && mvPracas.length > 0) {
        const uniquePracas = [...new Set(mvPracas.map(p => p.praca))].filter(Boolean);
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return uniquePracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.warn('Fallback MV falhou, tentando dados_corridas:', err);
    }

    try {
      const { data: fallbackPracas, error: fallbackError } = await supabase
        .from('dados_corridas')
        .select('praca')
        .not('praca', 'is', null)
        .order('praca')
        .limit(500);
      
      if (!fallbackError && fallbackPracas) {
        const uniquePracas = [...new Set(fallbackPracas.map(p => p.praca))].filter(Boolean);
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return uniquePracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.error('Todos os métodos de busca de praças falharam:', err);
    }

    return [];
  };

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

