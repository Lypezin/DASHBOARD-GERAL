'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  assigned_pracas: string[];
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
  const [showModal, setShowModal] = useState(false);

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
    const { data: profile, error } = await supabase
      .rpc('get_current_user_profile')
      .single() as { data: UserProfile | null; error: any };

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
      // Buscar todos os usuários
      const { data: allUsers, error: usersError } = await supabase.rpc('list_all_users');
      if (usersError) throw usersError;
      setUsers(allUsers || []);

      // Buscar usuários pendentes
      const { data: pending, error: pendingError } = await supabase.rpc('list_pending_users');
      if (pendingError) throw pendingError;
      setPendingUsers(pending || []);

      // Buscar praças disponíveis (função otimizada)
      const { data: pracasData, error: pracasError } = await supabase.rpc('list_pracas_disponiveis');
      if (pracasError) {
        console.warn('Erro ao buscar praças:', pracasError);
        // Fallback: buscar diretamente da tabela
        const { data: fallbackPracas } = await supabase
          .from('dados_corridas')
          .select('praca')
          .not('praca', 'is', null)
          .limit(100);
        
        const uniquePracas = [...new Set(fallbackPracas?.map(p => p.praca) || [])];
        setPracasDisponiveis(uniquePracas);
      } else {
        setPracasDisponiveis(pracasData?.map((p: any) => p.praca) || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = (user: User) => {
    setSelectedUser(user);
    setSelectedPracas(user.assigned_pracas || []);
    setShowModal(true);
  };

  const handleSaveApproval = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.rpc('approve_user', {
        user_id: selectedUser.id,
        pracas: selectedPracas,
      });

      if (error) throw error;

      setShowModal(false);
      setSelectedUser(null);
      setSelectedPracas([]);
      fetchData();
    } catch (err: any) {
      alert('Erro ao aprovar usuário: ' + err.message);
    }
  };

  const handleUpdatePracas = async (userId: string, pracas: string[]) => {
    try {
      const { error } = await supabase.rpc('update_user_pracas', {
        user_id: userId,
        pracas: pracas,
      });

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao atualizar praças: ' + err.message);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;

    try {
      const { error } = await supabase.rpc('revoke_user_access', {
        user_id: userId,
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Usuários</h1>
          <p className="mt-2 text-slate-600">Aprovar cadastros e gerenciar permissões</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            {error}
          </div>
        )}

        {/* Usuários Pendentes */}
        {pendingUsers.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <span className="text-2xl">⏳</span>
              Usuários Aguardando Aprovação ({pendingUsers.length})
            </h2>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveUser(user)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Aprovar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Todos os Usuários */}
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
            <span className="text-2xl">👥</span>
            Todos os Usuários ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Praças</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        {user.is_admin && (
                          <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="py-3">
                      {user.is_approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          ✓ Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
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
                              className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {praca}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Nenhuma</span>
                      )}
                    </td>
                    <td className="py-3">
                      {!user.is_admin && (
                        <div className="flex gap-2">
                          {user.is_approved ? (
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="rounded bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-200"
                            >
                              Revogar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveUser(user)}
                              className="rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
                            >
                              Aprovar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Aprovação */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">
              Aprovar Usuário
            </h3>
            <div className="mb-4">
              <p className="text-sm text-slate-600">Usuário:</p>
              <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
              <p className="text-sm text-slate-600">{selectedUser.email}</p>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold text-slate-700">Selecione as praças:</p>
              {pracasDisponiveis.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma praça disponível</p>
              ) : (
                <div className="space-y-2">
                  {pracasDisponiveis.map((praca) => (
                    <label
                      key={praca}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPracas.includes(praca)}
                        onChange={() => togglePracaSelection(praca)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-900">{praca}</span>
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
                className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveApproval}
                disabled={selectedPracas.length === 0}
                className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
