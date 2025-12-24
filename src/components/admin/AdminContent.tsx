
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminOrganizationsTab } from '@/components/admin/tabs/AdminOrganizationsTab';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserProfile } from '@/hooks/useAdminData';

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
    currentUser,
    users,
    pendingUsers,
    pracasDisponiveis,
    loading,
    error,
    fetchData,
    organizations,
    orgsLoading,
    orgsError,
    createOrganization,
    updateOrganization
}) => {
    const [activeTab, setActiveTab] = useState<'users' | 'organizations'>('users');

    return (
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
    );
};
