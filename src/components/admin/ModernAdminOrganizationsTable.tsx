import React from 'react';
import { Organization } from '@/hooks/auth/useOrganizations'; // Assuming Organization type is still needed from here
import { AdminOrganizationRow } from './AdminOrganizationRow';
import { useOrganizations } from '@/hooks/auth/useOrganizations';
import { useOrganizationSelection } from '@/hooks/auth/useOrganizationSelection';

interface AdminOrganizationsTableProps {
    organizations: Organization[];
    onEdit: (org: Organization) => void;
    onToggleActive: (org: Organization) => void;
}

export const ModernAdminOrganizationsTable: React.FC<AdminOrganizationsTableProps> = ({
    organizations,
    onEdit,
    onToggleActive,
}) => {
    return (
        <div className="rounded-md border bg-card">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Organização</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Slug</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Limite de Usuários</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {organizations.map((org) => (
                            <AdminOrganizationRow
                                key={org.id}
                                org={org}
                                onEdit={onEdit}
                                onToggleActive={onToggleActive}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
