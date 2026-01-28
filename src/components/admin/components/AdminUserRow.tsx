import React from 'react';
import { User, UserProfile } from '@/hooks/auth/useAdminData';
import { Organization } from '@/hooks/auth/useOrganizations';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { AdminUserCell } from './AdminUserCell';
import { AdminActionsMenu } from './AdminActionsMenu';

interface AdminUserRowProps {
    user: User;
    currentUser: UserProfile | null;
    organizations: Organization[];
    onApprove: (user: User) => void;
    onEditPracas: (user: User) => void;
    onRevokeAccess: (userId: string) => void;
    onToggleAdmin: (userId: string, currentIsAdmin: boolean) => void;
}

export const AdminUserRow: React.FC<AdminUserRowProps> = ({
    user,
    currentUser,
    organizations,
    onApprove,
    onEditPracas,
    onRevokeAccess,
    onToggleAdmin
}) => {
    const getOrganizationName = (orgId: string | null | undefined): string => {
        if (!orgId) return 'Sem organização';
        const org = organizations.find(o => o.id === orgId);
        return org?.name || 'Organização não encontrada';
    };

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="p-4 align-middle">
                <AdminUserCell user={user} />
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
                <AdminActionsMenu
                    user={user}
                    currentUser={currentUser}
                    onApprove={onApprove}
                    onEditPracas={onEditPracas}
                    onRevokeAccess={onRevokeAccess}
                    onToggleAdmin={onToggleAdmin}
                />
            </td>
        </tr>
    );
};
