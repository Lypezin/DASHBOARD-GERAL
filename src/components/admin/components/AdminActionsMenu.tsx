import React from 'react';
import { User } from '@/hooks/auth/useAdminData';
import { UserProfile } from '@/hooks/auth/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Shield,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Edit
} from 'lucide-react';

interface AdminActionsMenuProps {
    user: User;
    currentUser: UserProfile | null;
    onApprove: (user: User) => void;
    onEditPracas: (user: User) => void;
    onRevokeAccess: (userId: string) => void;
    onToggleAdmin: (userId: string, currentIsAdmin: boolean) => void;
}

export const AdminActionsMenu: React.FC<AdminActionsMenuProps> = ({
    user,
    currentUser,
    onApprove,
    onEditPracas,
    onRevokeAccess,
    onToggleAdmin
}) => {
    return (
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
    );
};
