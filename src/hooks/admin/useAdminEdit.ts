import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';
import { User } from '@/hooks/auth/useAdminData';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminEdit(fetchData: () => void) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedPracas, setSelectedPracas] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'marketing' | 'user' | 'master'>('user');
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const startEdit = (user: User) => {
        setEditingUser(user);
        setSelectedPracas(user.assigned_pracas || []);
        setSelectedRole(user.role || 'user');
        setSelectedOrganizationId(user.organization_id || null);
        setShowEditModal(true);
    };

    const cancelEdit = () => {
        setShowEditModal(false);
        setEditingUser(null);
        setSelectedPracas([]);
        setSelectedRole('user');
        setSelectedOrganizationId(null);
    };

    const saveEdit = async () => {
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

            cancelEdit();
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

    return {
        editState: {
            editingUser,
            selectedPracas,
            selectedRole,
            selectedOrganizationId,
            showEditModal,
        },
        editActions: {
            setSelectedPracas,
            setSelectedRole,
            setSelectedOrganizationId,
            startEdit,
            saveEdit,
            cancelEdit
        }
    };
}
