'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { useAdminData } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';
import { useOrganizations } from '@/hooks/auth/useOrganizations';
import { AdminContent } from '@/components/admin/AdminContent';

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

  const isAdmin = currentUser?.is_admin === true;

  const {
    organizations,
    loading: orgsLoading,
    error: orgsError,
    createOrganization,
    updateOrganization,
  } = useOrganizations({ enabled: isAdmin });

  useEffect(() => {
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void fetchData();
  }, [isAdmin, fetchData]);

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

  if (loading && !currentUser) {
    return <AdminLoadingSkeleton />;
  }

  return (
    <ErrorBoundary>
      {currentUser && (
        <AdminContent
          currentUser={currentUser}
          users={users}
          pendingUsers={pendingUsers}
          pracasDisponiveis={pracasDisponiveis}
          loading={loading}
          error={error}
          fetchData={fetchData}
          organizations={organizations}
          orgsLoading={orgsLoading}
          orgsError={orgsError}
          createOrganization={createOrganization}
          updateOrganization={updateOrganization}
        />
      )}
    </ErrorBoundary>
  );
}
