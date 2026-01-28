
import React from 'react';
import { Organization } from '@/contexts/OrganizationContext';
import { useOrganizations } from '@/hooks/auth/useOrganizations';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MoreHorizontal,
    Edit,
    Power,
    PowerOff,
    Users,
    Building2
} from 'lucide-react';

interface AdminOrganizationRowProps {
    org: Organization;
    onEdit: (org: Organization) => void;
    onToggleActive: (org: Organization) => void;
}

export const AdminOrganizationRow: React.FC<AdminOrganizationRowProps> = ({
    org,
    onEdit,
    onToggleActive,
}) => {
    return (
        <tr
            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        >
            <td className="p-4 align-middle">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        <span className="text-xs text-muted-foreground">ID: {org.id.slice(0, 8)}...</span>
                    </div>
                </div>
            </td>
            <td className="p-4 align-middle">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    {org.slug}
                </code>
            </td>
            <td className="p-4 align-middle">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{org.max_users} usuários</span>
                </div>
            </td>
            <td className="p-4 align-middle">
                {org.is_active ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                        Ativo
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        Inativo
                    </Badge>
                )}
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
                        <DropdownMenuItem onClick={() => onEdit(org)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onToggleActive(org)}
                            className={org.is_active ? "text-rose-600" : "text-emerald-600"}
                        >
                            {org.is_active ? (
                                <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Desativar
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Ativar
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
};
