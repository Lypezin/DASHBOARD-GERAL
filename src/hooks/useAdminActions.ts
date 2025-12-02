import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';
import { User, UserProfile } from './useAdminData';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminActions(
  currentUser: UserProfile | null,
  fetchData: () => void
) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPracas, setSelectedPracas] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'marketing' | 'user' | 'master'>('user');
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
      const { error } = await executeAdminRpc(
        'approve_user',
        {
          user_id: selectedUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        },
        async () => {
          const updateData: any = {
            is_approved: true,
            assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas,
            approved_at: new Date().toISOString(),
            approved_by: currentUser?.id || null,
            organization_id: selectedOrganizationId || null
          };

          if (selectedRole) {
            updateData.role = selectedRole;
            updateData.is_admin = (selectedRole === 'admin' || selectedRole === 'master');
          }

          return supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', selectedUser.id);
        }
      );

      if (error) throw error;

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
      const { error } = await executeAdminRpc(
        'update_user_pracas',
        {
          user_id: editingUser.id,
          pracas: selectedPracas,
          p_role: selectedRole,
          p_organization_id: selectedOrganizationId,
        },
        async () => {
          const updateData: any = {
            assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas
          };

          if (selectedRole) {
            updateData.role = selectedRole;
            updateData.is_admin = (selectedRole === 'admin' || selectedRole === 'master');
          }

          if (selectedOrganizationId) {
            updateData.organization_id = selectedOrganizationId;
          }

          return supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', editingUser.id);
        }
      );

      if (error) throw error;

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
      const { error } = await executeAdminRpc(
        'revoke_user_access',
        { user_id: userId },
        async () => supabase
          .from('user_profiles')
          .update({
            is_approved: false,
            status: 'pending',
            role: 'user',
            assigned_pracas: []
          })
          .eq('id', userId)
      );

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao revogar acesso: ' + err.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? 'remover admin de' : 'tornar admin';
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
      const { data, error } = await executeAdminRpc(
        'set_user_admin',
        {
          user_id: userId,
          make_admin: !currentIsAdmin,
        }
      );

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

