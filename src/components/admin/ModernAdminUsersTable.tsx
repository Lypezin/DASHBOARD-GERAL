import React, { useState } from 'react';
import { User } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';
import { Organization } from '@/hooks/auth/useOrganizations';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AdminUserRow } from './components/AdminUserRow';

import { useAdminUsersPagination } from './hooks/useAdminUsersPagination';
import { AdminUsersPaginationControls } from './components/AdminUsersPaginationControls';

interface AdminUsersTableProps {
    users: User[];
    organizations: Organization[];
    currentUser: UserProfile | null;
    onApprove: (user: User) => void;
    onEditPracas: (user: User) => void;
    onRevokeAccess: (userId: string) => void;
    onToggleAdmin: (userId: string, currentIsAdmin: boolean) => void;
}

export const ModernAdminUsersTable: React.FC<AdminUsersTableProps> = ({
    users,
    organizations,
    currentUser,
    onApprove,
    onEditPracas,
    onRevokeAccess,
    onToggleAdmin,
}) => {
    const {
        searchTerm,
        setSearchTerm,
        currentPage,
        totalPages,
        paginatedUsers,
        handlePreviousPage,
        handleNextPage,
    } = useAdminUsersPagination(users);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Usuários ({users.length})</h2>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuário</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Organização</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Praças</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedUsers.map((user) => (
                                <AdminUserRow
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    organizations={organizations}
                                    onApprove={onApprove}
                                    onEditPracas={onEditPracas}
                                    onRevokeAccess={onRevokeAccess}
                                    onToggleAdmin={onToggleAdmin}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminUsersPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
            />
        </div>
    );
};
