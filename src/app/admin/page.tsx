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
import { AdminOrganizationsTable } from '@/components/admin/AdminOrganizationsTable';
import { AdminOrganizationModal } from '@/components/admin/AdminOrganizationModal';
import { useAdminData, UserProfile } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useOrganizations, Organization } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'organizations'>('users');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  
  const {
    users,
    pendingUsers,
    pracasDisponiveis,
    loading,
    error,
    fetchData,
  } = useAdminData();

  const {
    organizations,
    loading: orgsLoading,
    error: orgsError,
    createOrganization,
    updateOrganization,
    fetchOrganizations,
  } = useOrganizations();

  const {
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

  const handleCreateOrg = () => {
    setEditingOrg(null);
    setShowOrgModal(true);
  };

  const handleEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setShowOrgModal(true);
  };

  const handleSaveOrg = async (formData: { name: string; slug: string; max_users: number }) => {
    if (editingOrg) {
      const result = await updateOrganization(editingOrg.id, formData);
      if (result.success) {
        setShowOrgModal(false);
        setEditingOrg(null);
      }
      return result;
    } else {
      const result = await createOrganization(formData);
      if (result.success) {
        setShowOrgModal(false);
      }
      return result;
    }
  };

  const handleToggleOrgActive = async (org: Organization) => {
    await updateOrganization(org.id, { is_active: !org.is_active });
  };

  if (loading) {
    return <AdminLoadingSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminHeader 
            totalUsers={users.length} 
            pendingUsers={pendingUsers.length}
            totalOrganizations={organizations.length}
          />

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              👥 Usuários
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'organizations'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏢 Organizações
            </button>
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

          {orgsError && activeTab === 'organizations' && (
            <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-rose-800 dark:text-rose-200">Erro ao Carregar Organizações</h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300">{orgsError}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <>
              <AdminPendingUsers pendingUsers={pendingUsers} onApprove={handleApproveUser} />

              <AdminUsersTable
                users={users}
                organizations={organizations}
                currentUser={currentUser}
                onApprove={handleApproveUser}
                onEditPracas={handleEditPracas}
                onRevokeAccess={handleRevokeAccess}
                onToggleAdmin={handleToggleAdmin}
              />
            </>
          )}

          {activeTab === 'organizations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Organizações ({organizations.length})
                </h2>
                <Button onClick={handleCreateOrg}>
                  ➕ Nova Organização
                </Button>
              </div>

              {orgsLoading ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">Carregando organizações...</p>
                </div>
              ) : (
                <AdminOrganizationsTable
                  organizations={organizations}
                  onEdit={handleEditOrg}
                  onToggleActive={handleToggleOrgActive}
                />
              )}
            </div>
          )}
        </div>

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

        {showOrgModal && (
          <AdminOrganizationModal
            organization={editingOrg}
            isOpen={showOrgModal}
            onClose={() => {
              setShowOrgModal(false);
              setEditingOrg(null);
            }}
            onSave={handleSaveOrg}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
