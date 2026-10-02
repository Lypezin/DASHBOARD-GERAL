import React from 'react';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserProfile } from '@/hooks/auth/types';
import { AdminHeader } from './AdminHeader';
import { AdminTabs } from './AdminTabs';

interface AdminContentProps {
    currentUser: UserProfile;
    users: any[];
    pendingUsers: any[];
    pracasDisponiveis: any[];
    loading: boolean;
    error: any;
    fetchData: () => Promise<void>;
    organizations: any[];
    orgsLoading: boolean;
    orgsError: any;
    createOrganization: any;
    updateOrganization: any;
}

export const AdminContent: React.FC<AdminContentProps> = ({
    currentUser, users, pendingUsers, pracasDisponiveis, loading, error, fetchData,
    organizations, orgsLoading, orgsError, createOrganization, updateOrganization
}) => {
    return (
        <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[1500px] space-y-6 animate-slide-up">
                <AdminHeader />

                <div className="relative">
                    <AdminStats
                        totalUsers={users.length}
                        pendingUsers={pendingUsers.length}
                        totalOrganizations={organizations.length}
                    />
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
                    <AdminTabs
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
                </div>
            </div>
        </div>
    );
};
