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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
                <AdminHeader />

                <div className="relative">
                    <AdminStats
                        totalUsers={users.length}
                        pendingUsers={pendingUsers.length}
                        totalOrganizations={organizations.length}
                    />
                </div>

                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
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
