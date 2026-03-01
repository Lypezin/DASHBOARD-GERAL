import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminMonitoringTab } from '@/components/admin/tabs/AdminMonitoringTab';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminOrganizationsTab } from '@/components/admin/tabs/AdminOrganizationsTab';
import { Shield, Sparkles, Building, Activity, Users } from 'lucide-react';
import { UserProfile } from '@/hooks/auth/types';

interface AdminTabsProps {
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

const TABS_CONFIG = [
    { value: 'users', label: 'Usuários', icon: Users },
    { value: 'organizations', label: 'Organizações', icon: Building },
    { value: 'monitoring', label: 'Monitoramento', icon: Activity }
] as const;

export const AdminTabs: React.FC<AdminTabsProps> = ({
    currentUser, users, pendingUsers, pracasDisponiveis, loading, error, fetchData,
    organizations, orgsLoading, orgsError, createOrganization, updateOrganization
}) => {
    const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'monitoring'>('users');

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
            <div className="flex items-center justify-between">
                <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 h-11">
                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger key={value} value={value} className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span>{label}</span>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            <TabsContent value="users" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
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
                </div>
            </TabsContent>

            <TabsContent value="organizations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <AdminOrganizationsTab
                        organizations={organizations}
                        loading={orgsLoading}
                        error={orgsError}
                        createOrganization={createOrganization}
                        updateOrganization={updateOrganization}
                    />
                </div>
            </TabsContent>

            <TabsContent value="monitoring" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AdminMonitoringTab />
            </TabsContent>
        </Tabs>
    );
};
