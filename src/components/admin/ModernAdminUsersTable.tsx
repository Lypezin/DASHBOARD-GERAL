import React, { useState } from 'react';
import { User } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';
import { Organization } from '@/hooks/auth/useOrganizations';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AdminUserRow } from './components/AdminUserRow';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Reset page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages || 1}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};
