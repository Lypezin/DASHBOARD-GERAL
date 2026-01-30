
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminOrganizationsTab } from '@/components/admin/tabs/AdminOrganizationsTab';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserProfile } from '@/hooks/auth/types';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto space-y-8"
            >
                {/* Unified Premium Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                                Painel Administrativo
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium pl-1">
                            Gerenciamento de usuários, permissões e organizações.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
                                Voltar ao Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

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
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'organizations')} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 h-11">
                                <TabsTrigger value="users" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Usuários</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="organizations" className="px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2">
                                        <BuildingIcon className="w-4 h-4" />
                                        <span>Organizações</span>
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
                    </Tabs>
                </div>
            </motion.div>
        </div>
    );
};

// Simple icons component for tabs
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    )
}
