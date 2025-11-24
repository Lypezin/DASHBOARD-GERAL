import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { User, UserProfile } from './useAdminData';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminActions(
  currentUser: UserProfile | null,
  fetchData: () => void
) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPracas, setSelectedPracas] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'marketing' | 'user'>('user');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleApproveUser = (user: User) => {
    setSelectedUser(user);
    setSelectedPracas(user.assigned_pracas || []);
    setSelectedRole(user.role || 'user');
    setSelectedOrganizationId(user.organization_id || null);
    setShowModal(true);
  };

  const handleSaveApproval = async () => {
    if (!selectedUser) return;

    try {
      let result: any;
      let error: any;

      try {
        const directResult = await supabase.rpc('approve_user', {
          user_id: selectedUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        });
        result = directResult.data;
        error = directResult.error;
      } catch (rpcErr) {
        const safeResult = await safeRpc('approve_user', {
          user_id: selectedUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        }, {
          timeout: 30000,
          validateParams: false
        });
        result = safeResult.data;
        error = safeResult.error;
      }

      if (error) {
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
          const updateData: any = {
            is_approved: true,
            assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas,
            approved_at: new Date().toISOString(),
            approved_by: currentUser?.id || null,
            organization_id: selectedOrganizationId || '00000000-0000-0000-0000-000000000001'
          };

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
      setSelectedOrganizationId(null);
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

  const handleEditPracas = (user: User) => {
    setEditingUser(user);
    setSelectedPracas(user.assigned_pracas || []);
    setSelectedRole(user.role || 'user');
    setSelectedOrganizationId(user.organization_id || null);
    setShowEditModal(true);
  };

  const handleSaveEditPracas = async () => {
    if (!editingUser) return;

    try {
      let result: any;
      let error: any;

      try {
        const directResult = await supabase.rpc('update_user_pracas', {
          user_id: editingUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        });
        result = directResult.data;
        error = directResult.error;
      } catch (rpcErr) {
        const safeResult = await safeRpc('update_user_pracas', {
          user_id: editingUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        }, {
          timeout: 30000,
          validateParams: false
        });
        result = safeResult.data;
        error = safeResult.error;
      }

      if (error) {
        if ((error as any)?.code === 'PGRST116' || (error as any)?.message?.includes('404') || (error as any)?.message?.includes('not found')) {
          if (IS_DEV) {
            safeLog.warn('Função RPC não encontrada, tentando atualização direta via Supabase');
          }

          const updateData: any = {
            assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas
          };

          if (selectedRole) {
            updateData.role = selectedRole;
            updateData.is_admin = (selectedRole === 'admin');
          }

          if (selectedOrganizationId) {
            updateData.organization_id = selectedOrganizationId;
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
      setSelectedOrganizationId(null);
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

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;

    try {
      const { error } = await safeRpc('revoke_user_access', {
        user_id: userId,
      }, {
        timeout: 30000,
        validateParams: true
      });

      if (error) {
        // Se der erro no RPC, tentar atualizar diretamente
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
        const is404 = errorCode === 'PGRST116' ||
          errorCode === '42883' ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          (errorMessage.includes('function') && errorMessage.includes('does not exist'));

        if (is404) {
          if (IS_DEV) {
            safeLog.warn('Função revoke_user_access não encontrada, tentando atualização direta');
          }

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              is_approved: false,
              status: 'pending',
              role: 'user',
              assigned_pracas: []
            })
            .eq('id', userId);

          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }
      fetchData();
    } catch (err: any) {
      alert('Erro ao revogar acesso: ' + err.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? 'remover admin de' : 'tornar admin';
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
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

        const errorObj = error as any;
        const errorMessage = String(errorObj?.message || errorObj?.details || errorObj?.hint || '');
        const errorCode = errorObj?.code || '';

        const is404 = errorCode === 'PGRST116' ||
          errorCode === '42883' ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('function') && errorMessage.includes('does not exist');

        if (is404) {
          alert('Função não encontrada. Isso pode ser um problema temporário de cache. Aguarde alguns segundos e tente novamente. Se o problema persistir, recarregue a página.');
          return;
        }

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

      if (IS_DEV) {
        safeLog.info('Status de admin alterado com sucesso:', { userId, make_admin: !currentIsAdmin, data });
      }
      fetchData();
    } catch (err: any) {
      if (IS_DEV) {
        safeLog.error('Erro inesperado ao alterar admin:', err);
      }
      const errorMessage = err?.message || err?.toString() || 'Ocorreu um erro. Tente novamente mais tarde.';
      alert('Erro ao alterar status de admin: ' + errorMessage);
    }
  };

  const handleCancelApproval = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedPracas([]);
    setSelectedRole('user');
    setSelectedOrganizationId(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setSelectedPracas([]);
    setSelectedRole('user');
    setSelectedOrganizationId(null);
  };

  return {
    selectedUser,
    selectedPracas,
    selectedRole,
    selectedOrganizationId,
    showModal,
    showEditModal,
    editingUser,
    setSelectedPracas,
    setSelectedRole,
    setSelectedOrganizationId,
    handleApproveUser,
    handleSaveApproval,
    handleCancelApproval,
    handleEditPracas,
    handleSaveEditPracas,
    handleCancelEdit,
    handleRevokeAccess,
    handleToggleAdmin,
  };
}

