
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminMonitoringTab } from '@/components/admin/tabs/AdminMonitoringTab';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminOrganizationsTab } from '@/components/admin/tabs/AdminOrganizationsTab';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserProfile } from '@/hooks/auth/types';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Building, Activity, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminHeader } from './AdminHeader';

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
    const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'monitoring'>('users');

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto space-y-8"
            >
                {/* Unified Premium Header */}
                <AdminHeader />

                {/* Stats Section with Glassmorphism */}
                <div className="relative">
                    <AdminStats
                        totalUsers={users.length}
                        pendingUsers={pendingUsers.length}
                        totalOrganizations={organizations.length}
                    />
                </div>

                {/* Main Content Area */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 h-11">
                                <TabsTrigger value="users" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>Usuários</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="organizations" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        <span>Organizações</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="monitoring" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        <span>Monitoramento</span>
                                    </div>
                                </TabsTrigger>
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
                </div>
            </motion.div>
        </div>
    );
};


