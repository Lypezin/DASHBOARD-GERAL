import React from 'react';
import { User } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';
import { useAdminActions } from '@/hooks/auth/useAdminActions';
import { useOrganizations, Organization } from '@/hooks/auth/useOrganizations';
import { ModernAdminUsersTable } from '@/components/admin/ModernAdminUsersTable';
import { ModernAdminPendingUsers } from '@/components/admin/ModernAdminPendingUsers';
import { AdminApprovalModal } from '@/components/admin/AdminApprovalModal';
import { AdminEditModal } from '@/components/admin/AdminEditModal';
import { AlertCircle } from 'lucide-react';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';

interface AdminUsersTabProps {
    currentUser: UserProfile | null; users: User[]; pendingUsers: User[]; pracasDisponiveis: string[];
    loading: boolean; error: string | null; fetchData: () => Promise<void>; organizations: Organization[];
}

export function AdminUsersTab({ currentUser, users, pendingUsers, pracasDisponiveis, loading, error, fetchData, organizations }: AdminUsersTabProps) {

    const { selectedUser, selectedPracas, selectedRole, selectedOrganizationId, showModal, showEditModal, editingUser, setSelectedPracas, setSelectedRole, setSelectedOrganizationId, handleApproveUser, handleSaveApproval, handleCancelApproval, handleEditPracas, handleSaveEditPracas, handleCancelEdit, handleRevokeAccess, handleToggleAdmin } = useAdminActions(currentUser, fetchData);

    if (loading) {
        return <AdminLoadingSkeleton />;
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Error Alerts */}
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <h3 className="font-medium">Erro no Carregamento</h3>
                    </div>
                    <p className="mt-1 text-sm">{error}</p>
                </div>
            )}

            <ModernAdminPendingUsers pendingUsers={pendingUsers as any} onApprove={handleApproveUser} />

            <ModernAdminUsersTable
                users={users as any}
                organizations={organizations}
                currentUser={currentUser as any}
                onApprove={handleApproveUser}
                onEditPracas={handleEditPracas}
                onRevokeAccess={handleRevokeAccess}
                onToggleAdmin={handleToggleAdmin}
            />

            {/* Modals */}
            {showEditModal && editingUser && (
                <AdminEditModal
                    user={editingUser}
                    pracasDisponiveis={pracasDisponiveis}
                    organizations={organizations}
                    selectedPracas={selectedPracas}
                    selectedRole={selectedRole}
                    selectedOrganizationId={selectedOrganizationId}
                    onPracasChange={setSelectedPracas}
                    onRoleChange={setSelectedRole}
                    onOrganizationChange={setSelectedOrganizationId}
                    onSave={handleSaveEditPracas}
                    onCancel={handleCancelEdit}
                />
            )}

            {showModal && selectedUser && (
                <AdminApprovalModal
                    user={selectedUser}
                    pracasDisponiveis={pracasDisponiveis}
                    organizations={organizations}
                    selectedPracas={selectedPracas}
                    selectedRole={selectedRole}
                    selectedOrganizationId={selectedOrganizationId}
                    onPracasChange={setSelectedPracas}
                    onRoleChange={setSelectedRole}
                    onOrganizationChange={setSelectedOrganizationId}
                    onApprove={handleSaveApproval}
                    onCancel={handleCancelApproval}
                />
            )}
        </div>
    );
}
