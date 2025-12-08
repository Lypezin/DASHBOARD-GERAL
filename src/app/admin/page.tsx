'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { useAdminData, UserProfile } from '@/hooks/useAdminData';
import { useOrganizations } from '@/hooks/useOrganizations';
import { AdminStats } from '@/components/admin/AdminStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminOrganizationsTab } from '@/components/admin/tabs/AdminOrganizationsTab';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'organizations'>('users');

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
  } = useOrganizations();

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

  if (loading && !currentUser) { // Initial loading state (auth)
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

          {/* Stats - Kept global for consistency */}
          <AdminStats
            totalUsers={users.length}
            pendingUsers={pendingUsers.length}
            totalOrganizations={organizations.length}
          />

          {/* Main Content */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'organizations')}>
              <TabsList>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="organizations">Organizações</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <AdminUsersTab
                  currentUser={currentUser}
                  users={users}
                  pendingUsers={pendingUsers}
                  pracasDisponiveis={pracasDisponiveis}
                  loading={loading}
                  error={error}
                  fetchData={fetchData}
                  organizations={organizations}
                />
              </TabsContent>

              <TabsContent value="organizations">
                <AdminOrganizationsTab
                  organizations={organizations}
                  loading={orgsLoading}
                  error={orgsError}
                  createOrganization={createOrganization}
                  updateOrganization={updateOrganization}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
