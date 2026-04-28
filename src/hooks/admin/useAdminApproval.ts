import { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';
import { User } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminApproval(_currentUser: UserProfile | null, fetchData: () => void) {
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
                { user_id: selectedUser.id, pracas: selectedPracas, p_role: selectedRole, p_organization_id: selectedOrganizationId }
            );

            if (error) throw error;

            cancelApproval();
            fetchData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? String(err) : 'Ocorreu um erro. Tente novamente mais tarde.');
            if (IS_DEV) safeLog.error('Erro ao aprovar usuário:', { error: err, user_id: selectedUser?.id, pracas: selectedPracas, role: selectedRole, errorMessage });
            alert('Erro ao aprovar usuário: ' + errorMessage);
        }
    };

    return {
        approvalState: { selectedUser, selectedPracas, selectedRole, selectedOrganizationId, showModal },
        approvalActions: { setSelectedPracas, setSelectedRole, setSelectedOrganizationId, startApproval, saveApproval, cancelApproval }
    };
}
