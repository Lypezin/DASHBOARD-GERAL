'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const IS_DEV = process.env.NODE_ENV === 'development';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  assigned_pracas: string[];
  role?: 'admin' | 'marketing' | 'user';
  created_at: string;
  approved_at: string | null;
}

interface UserProfile {
  id: string;
  is_admin: boolean;
  is_approved: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pracasDisponiveis, setPracasDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPracas, setSelectedPracas] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'marketing' | 'user'>('user');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar se é admin
    const { data: profile, error } = await safeRpc<UserProfile>('get_current_user_profile', {}, {
      timeout: 10000,
      validateParams: false
    });

    if (error || !profile?.is_admin) {
      router.push('/');
      return;
    }

    setCurrentUser(profile);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Executar todas as operações em paralelo para melhor performance
      const [usersPromise, pendingPromise, pracasPromise] = await Promise.allSettled([
        safeRpc<User[]>('list_all_users', {}, { timeout: 30000, validateParams: false }),
        safeRpc<User[]>('list_pending_users', {}, { timeout: 30000, validateParams: false }),
        fetchPracasWithFallback()
      ]);

      // Processar usuários
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

      // Processar usuários pendentes
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

      // Processar praças
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

  const fetchPracasWithFallback = async (): Promise<string[]> => {
    // Cache local das praças para evitar buscar repetidamente
    const cachedPracas = sessionStorage.getItem('admin_pracas_cache');
    const cacheTime = sessionStorage.getItem('admin_pracas_cache_time');
    
    // Verificar se cache é válido (menos de 5 minutos)
    if (cachedPracas && cacheTime) {
      const now = Date.now();
      const cached = parseInt(cacheTime);
      if (now - cached < 5 * 60 * 1000) { // 5 minutos
        return JSON.parse(cachedPracas);
      }
    }

    try {
      // Tentar função otimizada primeiro
      const { data: pracasData, error: pracasError } = await safeRpc<string[]>('list_pracas_disponiveis', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (!pracasError && pracasData && pracasData.length > 0) {
        const pracas = pracasData.map((p: any) => p.praca).filter(Boolean);
        // Salvar no cache
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(pracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return pracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.warn('Função list_pracas_disponiveis falhou, tentando fallback:', err);
    }

    // Fallback 1: Buscar da materialized view
    try {
      const { data: mvPracas, error: mvError } = await supabase
        .from('mv_aderencia_agregada')
        .select('praca')
        .not('praca', 'is', null)
        .order('praca');
      
      if (!mvError && mvPracas && mvPracas.length > 0) {
        const uniquePracas = [...new Set(mvPracas.map(p => p.praca))].filter(Boolean);
        // Salvar no cache
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return uniquePracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.warn('Fallback MV falhou, tentando dados_corridas:', err);
    }

    // Fallback 2: Buscar diretamente da tabela principal
    try {
      const { data: fallbackPracas, error: fallbackError } = await supabase
        .from('dados_corridas')
        .select('praca')
        .not('praca', 'is', null)
        .order('praca')
        .limit(500); // Aumentar limite para pegar mais praças
      
      if (!fallbackError && fallbackPracas) {
        const uniquePracas = [...new Set(fallbackPracas.map(p => p.praca))].filter(Boolean);
        // Salvar no cache
        sessionStorage.setItem('admin_pracas_cache', JSON.stringify(uniquePracas));
        sessionStorage.setItem('admin_pracas_cache_time', Date.now().toString());
        return uniquePracas;
      }
    } catch (err) {
      if (IS_DEV) safeLog.error('Todos os métodos de busca de praças falharam:', err);
    }

    // Se tudo falhar, retornar lista vazia
    return [];
  };

  const handleApproveUser = (user: User) => {
    setSelectedUser(user);
    setSelectedPracas(user.assigned_pracas || []);
    setSelectedRole(user.role || 'user');
    setShowModal(true);
  };

  const handleSaveApproval = async () => {
    if (!selectedUser) return;

    try {
      let result: any;
      let error: any;
      
      // Tentar chamar diretamente primeiro (bypass do safeRpc para debug)
      try {
        const directResult = await supabase.rpc('approve_user', {
          user_id: selectedUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
        });
        result = directResult.data;
        error = directResult.error;
      } catch (rpcErr) {
        // Se falhar, tentar com safeRpc
        const safeResult = await safeRpc('approve_user', {
          user_id: selectedUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
        }, {
          timeout: 30000,
          validateParams: false
        });
        result = safeResult.data;
        error = safeResult.error;
      }

      if (error) {
        // Verificar se é erro 404 (função não encontrada)
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
        const is404 = errorCode === 'PGRST116' || 
                     errorCode === '42883' ||
                     errorMessage.includes('404') || 
                     errorMessage.includes('not found') ||
                     (errorMessage.includes('function') && errorMessage.includes('does not exist'));
        
        if (is404) {
          if (IS_DEV) {
            safeLog.warn('Função RPC não encontrada, tentando atualização direta via Supabase');
          }
          // Fallback: atualizar diretamente via Supabase client
          const updateData: any = {
            is_approved: true,
            assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas,
            approved_at: new Date().toISOString(),
            approved_by: currentUser?.id || null
          };
          
          // Atualizar role e is_admin baseado no selectedRole
          if (selectedRole) {
            updateData.role = selectedRole;
            updateData.is_admin = (selectedRole === 'admin');
          }
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', selectedUser.id);
          
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      setShowModal(false);
      setSelectedUser(null);
      setSelectedPracas([]);
      setSelectedRole('user');
      fetchData();
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Ocorreu um erro. Tente novamente mais tarde.';
      if (IS_DEV) {
        safeLog.error('Erro ao aprovar usuário:', {
          error: err,
          user_id: selectedUser?.id,
          pracas: selectedPracas,
          role: selectedRole,
          errorMessage
        });
      }
      alert('Erro ao aprovar usuário: ' + errorMessage);
    }
  };

  const handleUpdatePracas = async (userId: string, pracas: string[]) => {
    try {
      // Buscar o usuário para pegar o role atual
      const user = users.find(u => u.id === userId);
      const currentRole = user?.role || 'user';
      
      // Tentar chamar diretamente primeiro
      let result: any;
      let error: any;
      
      try {
        const directResult = await supabase.rpc('update_user_pracas', {
          user_id: userId,
          pracas: pracas,
          p_role: currentRole,
        });
        result = directResult.data;
        error = directResult.error;
      } catch (rpcErr) {
        // Se falhar, tentar com safeRpc
        const safeResult = await safeRpc('update_user_pracas', {
          user_id: userId,
          pracas: pracas,
          p_role: currentRole,
        }, {
          timeout: 30000,
          validateParams: false
        });
        result = safeResult.data;
        error = safeResult.error;
      }

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Ocorreu um erro. Tente novamente mais tarde.';
      if (IS_DEV) {
        safeLog.error('Erro ao atualizar praças (handleUpdatePracas):', {
          error: err,
          user_id: userId,
          pracas: pracas
        });
      }
      alert('Erro ao atualizar praças: ' + errorMessage);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;

    try {
      const { error } = await safeRpc('revoke_user_access', {
        user_id: userId,
      }, {
        timeout: 30000,
        validateParams: true
      });

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao revogar acesso: ' + err.message);
    }
  };

  const togglePracaSelection = (praca: string) => {
    if (selectedPracas.includes(praca)) {
      setSelectedPracas(selectedPracas.filter(p => p !== praca));
    } else {
      setSelectedPracas([...selectedPracas, praca]);
    }
  };

  const handleEditPracas = (user: User) => {
    setEditingUser(user);
    setSelectedPracas(user.assigned_pracas || []);
    setSelectedRole(user.role || 'user');
    setShowEditModal(true);
  };

  const handleSaveEditPracas = async () => {
    if (!editingUser) return;

    try {
      // Tentar chamar diretamente primeiro para evitar problemas de cache do PostgREST
      let result: any;
      let error: any;
      
      try {
        const directResult = await supabase.rpc('update_user_pracas', {
          user_id: editingUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
        });
        result = directResult.data;
        error = directResult.error;
      } catch (rpcErr) {
        // Se falhar, tentar com safeRpc
        const safeResult = await safeRpc('update_user_pracas', {
          user_id: editingUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
        }, {
          timeout: 30000,
          validateParams: false // Desabilitar validação para evitar problemas
        });
        result = safeResult.data;
        error = safeResult.error;
      }

      if (error) {
        // Se for erro 404, tentar atualizar diretamente via Supabase
        if ((error as any)?.code === 'PGRST116' || (error as any)?.message?.includes('404') || (error as any)?.message?.includes('not found')) {
          if (IS_DEV) {
            safeLog.warn('Função RPC não encontrada, tentando atualização direta via Supabase');
          }
          
          // Fallback: atualizar diretamente via Supabase
          const updateData: any = {
            assigned_pracas: selectedPracas
          };
          
          if (selectedRole) {
            updateData.role = selectedRole;
            updateData.is_admin = (selectedRole === 'admin');
          }
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', editingUser.id);
          
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      setShowEditModal(false);
      setEditingUser(null);
      setSelectedPracas([]);
      setSelectedRole('user');
      fetchData();
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Ocorreu um erro. Tente novamente mais tarde.';
      if (IS_DEV) {
        safeLog.error('Erro ao atualizar praças:', {
          error: err,
          user_id: editingUser?.id,
          pracas: selectedPracas,
          role: selectedRole,
          errorMessage
        });
      }
      alert('Erro ao atualizar praças: ' + errorMessage);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? 'remover admin de' : 'tornar admin';
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
      // Tentar chamar a função RPC diretamente primeiro (bypass do safeRpc para debug)
      let data: any = null;
      let error: any = null;
      
      try {
        const result = await supabase.rpc('set_user_admin', {
          user_id: userId,
          make_admin: !currentIsAdmin,
        });
        data = result.data;
        error = result.error;
      } catch (rpcErr) {
        // Se falhar, tentar com safeRpc
        const safeResult = await safeRpc('set_user_admin', {
          user_id: userId,
          make_admin: !currentIsAdmin,
        }, {
          timeout: 30000,
          validateParams: false
        });
        data = safeResult.data;
        error = safeResult.error;
      }

      if (error) {
        // Log detalhado do erro em desenvolvimento
        if (IS_DEV) {
          safeLog.error('Erro detalhado ao alterar admin:', {
            error,
            userId,
            make_admin: !currentIsAdmin,
            errorCode: (error as any)?.code,
            errorMessage: (error as any)?.message,
            errorDetails: (error as any)?.details,
            errorHint: (error as any)?.hint
          });
        }
        
        // Extrair mensagem de erro mais detalhada
        const errorObj = error as any;
        const errorMessage = String(errorObj?.message || errorObj?.details || errorObj?.hint || '');
        const errorCode = errorObj?.code || '';
        
        // Verificar se é erro 404 (função não encontrada)
        const is404 = errorCode === 'PGRST116' || 
                     errorCode === '42883' ||
                     errorMessage.includes('404') ||
                     errorMessage.includes('not found') ||
                     errorMessage.includes('function') && errorMessage.includes('does not exist');
        
        if (is404) {
          // Função não encontrada - pode ser cache do PostgREST
          alert('Função não encontrada. Isso pode ser um problema temporário de cache. Aguarde alguns segundos e tente novamente. Se o problema persistir, recarregue a página.');
          return;
        }
        
        // Mensagem mais específica baseada no código de erro
        let userMessage = 'Erro ao alterar status de admin: ';
        if (errorCode === '42501' || errorMessage.includes('permission denied')) {
          userMessage += 'Você não tem permissão para realizar esta ação.';
        } else if (errorCode === '23505' || errorMessage.includes('unique constraint')) {
          userMessage += 'Este usuário já possui este status.';
        } else if (errorMessage) {
          userMessage += errorMessage;
        } else {
          userMessage += 'Ocorreu um erro. Tente novamente mais tarde.';
        }
        
        alert(userMessage);
        return;
      }
      
      // Sucesso
      if (IS_DEV) {
        safeLog.info('Status de admin alterado com sucesso:', { userId, make_admin: !currentIsAdmin, data });
      }
      fetchData();
    } catch (err: any) {
      // Erro inesperado
      if (IS_DEV) {
        safeLog.error('Erro inesperado ao alterar admin:', err);
      }
      const errorMessage = err?.message || err?.toString() || 'Ocorreu um erro. Tente novamente mais tarde.';
      alert('Erro ao alterar status de admin: ' + errorMessage);
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* Skeleton Header */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 rounded"></div>
          </div>
          
          {/* Skeleton Cards */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-48 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                      <div className="h-4 w-64 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-20 bg-emerald-200 dark:bg-emerald-900 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 bg-blue-200 dark:bg-blue-900 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <th key={i} className="pb-3">
                          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="py-3">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header melhorado com estatísticas */}
        <div className="mb-8">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-white">
                <h1 className="text-2xl lg:text-3xl font-bold">👑 Painel Administrativo</h1>
                <p className="mt-2 text-sm lg:text-base text-indigo-100">Gerenciamento completo de usuários e permissões</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-2xl lg:text-3xl font-bold text-white">{users.length}</p>
                  <p className="text-xs lg:text-sm text-indigo-100">Total de Usuários</p>
                </div>
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-2xl lg:text-3xl font-bold text-white">{pendingUsers.length}</p>
                  <p className="text-xs lg:text-sm text-indigo-100">Pendentes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-rose-800 dark:text-rose-200">Erro no Carregamento</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Usuários Pendentes */}
        {pendingUsers.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 p-6 shadow-md">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              <span className="text-2xl">⏳</span>
              Usuários Aguardando Aprovação ({pendingUsers.length})
            </h2>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                      Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveUser(user)}
                    className="rounded-lg bg-emerald-600 dark:bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    Aprovar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Todos os Usuários */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <span className="text-2xl">👥</span>
            Todos os Usuários ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Praças</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                        <div className="flex flex-wrap gap-1">
                          {user.is_admin && (
                            <span className="inline-block rounded bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                              Admin
                            </span>
                          )}
                          {user.role === 'marketing' && !user.is_admin && (
                            <span className="inline-block rounded bg-pink-100 dark:bg-pink-900/50 px-2 py-0.5 text-xs font-semibold text-pink-700 dark:text-pink-300">
                              Marketing
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="py-3">
                      {user.is_approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          ✓ Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          ⏳ Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sm">
                      {user.assigned_pracas && user.assigned_pracas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assigned_pracas.map((praca) => (
                            <span
                              key={praca}
                              className="rounded bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                            >
                              {praca}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Nenhuma</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {!user.is_admin && !user.is_approved && (
                          <button
                            onClick={() => handleApproveUser(user)}
                            className="rounded bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-900"
                          >
                            Aprovar
                          </button>
                        )}
                        
                        {user.is_approved && !user.is_admin && (
                          <>
                            <button
                              onClick={() => handleEditPracas(user)}
                              className="rounded bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900"
                            >
                              Editar Praças
                            </button>
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="rounded bg-rose-100 dark:bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-200 dark:hover:bg-rose-900"
                            >
                              Revogar
                            </button>
                          </>
                        )}
                        
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                              user.is_admin
                                ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900'
                                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
                            }`}
                          >
                            {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Praças */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>✏️</span>
                Editar Praças
              </h3>
              <div className="mt-2 text-blue-100">
                <p className="font-medium">{editingUser.full_name}</p>
                <p className="text-sm opacity-90">{editingUser.email}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cargo:
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'marketing' | 'user')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                  >
                    <option value="user">Usuário</option>
                    <option value="marketing">Marketing</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedRole === 'marketing' && 'Marketing tem acesso a todas as cidades, mas sem privilégios de admin'}
                    {selectedRole === 'admin' && 'Administrador tem acesso total ao sistema'}
                    {selectedRole === 'user' && 'Usuário comum com acesso apenas às praças selecionadas'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selecione as praças:</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPracas.length} de {pracasDisponiveis.length} selecionadas
                  </span>
                </div>
                
                {pracasDisponiveis.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-4xl mb-2 block">🏢</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma praça disponível</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Verifique a conexão ou tente recarregar</p>
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
                    {pracasDisponiveis.map((praca) => (
                      <label
                        key={praca}
                        className="flex items-center gap-3 rounded-lg border border-transparent p-3 cursor-pointer transition-all hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPracas.includes(praca)}
                          onChange={() => togglePracaSelection(praca)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {praca}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setSelectedPracas([]);
                  }}
                  className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 py-3 font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditPracas}
                  disabled={selectedRole !== 'marketing' && selectedPracas.length === 0}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 shadow-lg"
                >
                  💾 Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aprovação */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>✅</span>
                Aprovar Usuário
              </h3>
              <div className="mt-2 text-emerald-100">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm opacity-90">{selectedUser.email}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cargo:
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'marketing' | 'user')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900"
                  >
                    <option value="user">Usuário</option>
                    <option value="marketing">Marketing</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedRole === 'marketing' && 'Marketing tem acesso a todas as cidades, mas sem privilégios de admin'}
                    {selectedRole === 'admin' && 'Administrador tem acesso total ao sistema'}
                    {selectedRole === 'user' && 'Usuário comum com acesso apenas às praças selecionadas'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selecione as praças de acesso:</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPracas.length} de {pracasDisponiveis.length} selecionadas
                  </span>
                </div>
                
                {pracasDisponiveis.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-8 text-center">
                    <span className="text-4xl mb-2 block">⚠️</span>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Nenhuma praça disponível</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">O usuário não poderá ser aprovado sem praças</p>
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
                    {pracasDisponiveis.map((praca) => (
                      <label
                        key={praca}
                        className="flex items-center gap-3 rounded-lg border border-transparent p-3 cursor-pointer transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPracas.includes(praca)}
                          onChange={() => togglePracaSelection(praca)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          {praca}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setSelectedPracas([]);
                  }}
                  className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 py-3 font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveApproval}
                  disabled={selectedRole !== 'marketing' && selectedPracas.length === 0}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 py-3 font-semibold text-white transition-all hover:from-emerald-700 hover:to-teal-700 dark:hover:from-emerald-600 dark:hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 shadow-lg"
                >
                  ✅ Aprovar Acesso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
