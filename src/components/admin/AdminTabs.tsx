import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminTableSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { ViewTransition } from '@/components/ui/view-transition';
import { Building, Users } from 'lucide-react';
import { UserProfile } from '@/hooks/auth/types';

const AdminOrganizationsTab = dynamic(
    () => import('@/components/admin/tabs/AdminOrganizationsTab').then(mod => mod.AdminOrganizationsTab),
    { loading: () => <AdminTableSkeleton /> }
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
    { value: 'organizations', label: 'Organizações', icon: Building }
] as const;

export const AdminTabs: React.FC<AdminTabsProps> = ({
    currentUser, users, pendingUsers, pracasDisponiveis, loading, error, fetchData,
    organizations, orgsLoading, orgsError, createOrganization, updateOrganization
}) => {
    const [activeTab, setActiveTab] = useState<'users' | 'organizations'>('users');
    const shouldReduceMotion = useReducedMotion() ?? false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
                    {TABS_CONFIG.map(({ value, label, icon: Icon }) => {
                        const active = activeTab === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setActiveTab(value)}
                                className={cn(
                                    'relative inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    active
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId={shouldReduceMotion ? undefined : 'admin-tabs-pill'}
                                        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 34 }}
                                        className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-slate-950"
                                    />
                                )}
                                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                                <span className="relative z-10">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <ViewTransition stateKey={activeTab} preventExitInteraction>
                {activeTab === 'users' ? (
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
                ) : (
                    <AdminOrganizationsTab
                        organizations={organizations}
                        loading={orgsLoading}
                        error={orgsError}
                        createOrganization={createOrganization}
                        updateOrganization={updateOrganization}
                    />
                )}
            </ViewTransition>
        </div>
    );
};
