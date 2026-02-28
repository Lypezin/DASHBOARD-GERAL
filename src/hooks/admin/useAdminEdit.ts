import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';
import { User } from '@/hooks/auth/useAdminData';
import { buildUserUpdatePayload } from './utils/adminEditPayload';

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
                    const updateData = buildUserUpdatePayload(selectedRole, selectedPracas, selectedOrganizationId);
                    return supabase.from('user_profiles').update(updateData).eq('id', editingUser.id);
                }
            );

            if (error) throw error;
            cancelEdit();
            fetchData();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            if (IS_DEV) {
                safeLog.error('Erro ao atualizar praças:', { error: err, user_id: editingUser?.id, errMsg });
            }
            alert('Erro ao atualizar praças: ' + errMsg);
        }
    };

    return {
        editState: { editingUser, selectedPracas, selectedRole, selectedOrganizationId, showEditModal },
        editActions: { setSelectedPracas, setSelectedRole, setSelectedOrganizationId, startEdit, saveEdit, cancelEdit }
    };
}
