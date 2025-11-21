'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminApprovalModal } from '@/components/admin/AdminApprovalModal';
import { AdminEditModal } from '@/components/admin/AdminEditModal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPendingUsers } from '@/components/admin/AdminPendingUsers';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { useAdminData, UserProfile } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const {
    users,
    pendingUsers,
    pracasDisponiveis,
    loading,
    error,
    fetchData,
  } = useAdminData();

  const {
    selectedUser,
    selectedPracas,
    selectedRole,
    showModal,
    showEditModal,
    editingUser,
    setSelectedPracas,
    setSelectedRole,
    setShowModal,
    setShowEditModal,
    setEditingUser,
    handleApproveUser,
    handleSaveApproval,
    handleEditPracas,
    handleSaveEditPracas,
    handleRevokeAccess,
    handleToggleAdmin,
  } = useAdminActions(currentUser, fetchData);

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


  if (loading) {
    return <AdminLoadingSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminHeader totalUsers={users.length} pendingUsers={pendingUsers.length} />

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

          <AdminPendingUsers pendingUsers={pendingUsers} onApprove={handleApproveUser} />

          <AdminUsersTable
            users={users}
            currentUser={currentUser}
            onApprove={handleApproveUser}
            onEditPracas={handleEditPracas}
            onRevokeAccess={handleRevokeAccess}
            onToggleAdmin={handleToggleAdmin}
          />
        </div>

        {showEditModal && editingUser && (
          <AdminEditModal
            user={editingUser}
            pracasDisponiveis={pracasDisponiveis}
            selectedPracas={selectedPracas}
            selectedRole={selectedRole}
            onPracasChange={setSelectedPracas}
            onRoleChange={setSelectedRole}
            onSave={handleSaveEditPracas}
            onCancel={() => {
              setShowEditModal(false);
              setEditingUser(null);
              setSelectedPracas([]);
            }}
          />
        )}

        {showModal && selectedUser && (
          <AdminApprovalModal
            user={selectedUser}
            pracasDisponiveis={pracasDisponiveis}
            selectedPracas={selectedPracas}
            selectedRole={selectedRole}
            onPracasChange={setSelectedPracas}
            onRoleChange={setSelectedRole}
            onApprove={handleSaveApproval}
            onCancel={() => {
              setShowModal(false);
              setSelectedUser(null);
              setSelectedPracas([]);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
