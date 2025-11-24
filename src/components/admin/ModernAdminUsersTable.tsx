import React, { useState } from 'react';
import { User, UserProfile } from '@/hooks/useAdminData';
import { Organization } from '@/hooks/useOrganizations';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    MoreHorizontal,
    Shield,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Edit,
    Trash,
    Search,
    Building2,
    MapPin
} from 'lucide-react';

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

    const getOrganizationName = (orgId: string | null | undefined): string => {
        if (!orgId) return 'Sem organização';
        const org = organizations.find(o => o.id === orgId);
        return org?.name || 'Organização não encontrada';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                >
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                <div className="mt-1 flex gap-1">
                                                    {user.is_admin && (
                                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 gap-1">
                                                            <Shield className="h-3 w-3" /> Admin
                                                        </Badge>
                                                    )}
                                                    {user.role === 'marketing' && !user.is_admin && (
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                            Marketing
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>{getOrganizationName(user.organization_id)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {user.is_approved ? (
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                                                Aprovado
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100">
                                                Pendente
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {user.assigned_pracas && user.assigned_pracas.length > 0 ? (
                                                user.assigned_pracas.slice(0, 3).map((praca) => (
                                                    <Badge key={praca} variant="outline" className="text-[10px]">
                                                        {praca}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Nenhuma</span>
                                            )}
                                            {user.assigned_pracas && user.assigned_pracas.length > 3 && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    +{user.assigned_pracas.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => navigator.clipboard.writeText(user.email)}
                                                >
                                                    Copiar Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {!user.is_admin && !user.is_approved && (
                                                    <DropdownMenuItem onClick={() => onApprove(user)} className="text-emerald-600">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Aprovar Acesso
                                                    </DropdownMenuItem>
                                                )}
                                                {user.is_approved && !user.is_admin && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onEditPracas(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar Praças
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onRevokeAccess(user.id)} className="text-rose-600">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Revogar Acesso
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {user.id !== currentUser?.id && (
                                                    <DropdownMenuItem onClick={() => onToggleAdmin(user.id, user.is_admin)}>
                                                        {user.is_admin ? (
                                                            <>
                                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                                Remover Admin
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Tornar Admin
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
