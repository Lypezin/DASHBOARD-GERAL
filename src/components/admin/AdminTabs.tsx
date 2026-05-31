import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { Building, Activity, Users } from 'lucide-react';
import { UserProfile } from '@/hooks/auth/types';

const AdminOrganizationsTab = dynamic(
    () => import('@/components/admin/tabs/AdminOrganizationsTab').then(mod => mod.AdminOrganizationsTab),
    { loading: () => <div className="p-8 text-center text-muted-foreground">Carregando organizacoes...</div> }
);

const AdminMonitoringTab = dynamic(
    () => import('@/components/admin/tabs/AdminMonitoringTab').then(mod => mod.AdminMonitoringTab),
    { loading: () => <div className="p-8 text-center text-muted-foreground">Carregando monitoramento...</div> }
);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-850/80">
                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => {
                        const active = activeTab === value;
                        return (
                            <button
                                key={value}
                                onClick={() => setActiveTab(value as any)}
                                className={cn(
                                    'relative inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-200 focus:outline-none',
                                    active
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="activeAdminTab"
                                        className="absolute inset-0 rounded-xl bg-white dark:bg-slate-950 shadow-sm"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                                <span className="relative z-10">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="focus-visible:outline-none focus-visible:ring-0 w-full"
                >
                    {activeTab === 'users' && (
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
                    )}
                    {activeTab === 'organizations' && (
                        <AdminOrganizationsTab
                            organizations={organizations}
                            loading={orgsLoading}
                            error={orgsError}
                            createOrganization={createOrganization}
                            updateOrganization={updateOrganization}
                        />
                    )}
                    {activeTab === 'monitoring' && (
                        <AdminMonitoringTab />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
