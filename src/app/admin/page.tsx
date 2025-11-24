'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminApprovalModal } from '@/components/admin/AdminApprovalModal';
import { AdminEditModal } from '@/components/admin/AdminEditModal';
import { AdminOrganizationModal } from '@/components/admin/AdminOrganizationModal';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { useAdminData, UserProfile } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useOrganizations, Organization } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { AdminStats } from '@/components/admin/AdminStats';
import { ModernAdminUsersTable } from '@/components/admin/ModernAdminUsersTable';
import { ModernAdminOrganizationsTable } from '@/components/admin/ModernAdminOrganizationsTable';
import { ModernAdminPendingUsers } from '@/components/admin/ModernAdminPendingUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus } from 'lucide-react';

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
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Configurações Administrativas</h1>
            <p className="text-muted-foreground">
              Gerencie usuários, permissões e organizações do sistema.
            </p>
          </div>

          {/* Stats */}
          <AdminStats
            totalUsers={users.length}
            pendingUsers={pendingUsers.length}
            totalOrganizations={organizations.length}
          />

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

          {orgsError && activeTab === 'organizations' && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <h3 className="font-medium">Erro ao Carregar Organizações</h3>
              </div>
              <p className="mt-1 text-sm">{orgsError}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'organizations')}>
              <TabsList>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="organizations">Organizações</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6 animate-in fade-in-50 duration-500">
                <ModernAdminPendingUsers pendingUsers={pendingUsers} onApprove={handleApproveUser} />
                <ModernAdminUsersTable
                  users={users}
                  organizations={organizations}
                  currentUser={currentUser}
                  onApprove={handleApproveUser}
                  onEditPracas={handleEditPracas}
                  onRevokeAccess={handleRevokeAccess}
                  onToggleAdmin={handleToggleAdmin}
                />
              </TabsContent>

              <TabsContent value="organizations" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold tracking-tight">
                    Organizações ({organizations.length})
                  </h2>
                  <Button onClick={handleCreateOrg}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Organização
                  </Button>
                </div>

                {orgsLoading ? (
                  <div className="rounded-md border p-8 text-center text-muted-foreground">
                    Carregando organizações...
                  </div>
                ) : (
                  <ModernAdminOrganizationsTable
                    organizations={organizations}
                    onEdit={handleEditOrg}
                    onToggleActive={handleToggleOrgActive}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

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
