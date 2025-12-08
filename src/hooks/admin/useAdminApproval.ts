import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';
import { User, UserProfile } from '../useAdminData';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminApproval(
    currentUser: UserProfile | null,
    fetchData: () => void
) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPracas, setSelectedPracas] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'marketing' | 'user' | 'master'>('user');
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const startApproval = (user: User) => {
        setSelectedUser(user);
        setSelectedPracas(user.assigned_pracas || []);
        setSelectedRole(user.role || 'user');
        setSelectedOrganizationId(user.organization_id || null);
        setShowModal(true);
    };

    const cancelApproval = () => {
        setShowModal(false);
        setSelectedUser(null);
        setSelectedPracas([]);
        setSelectedRole('user');
        setSelectedOrganizationId(null);
    };

    const saveApproval = async () => {
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

            cancelApproval();
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

    return {
        approvalState: {
            selectedUser,
            selectedPracas,
            selectedRole,
            selectedOrganizationId,
            showModal,
        },
        approvalActions: {
            setSelectedPracas,
            setSelectedRole,
            setSelectedOrganizationId,
            startApproval,
            saveApproval,
            cancelApproval
        }
    };
}
