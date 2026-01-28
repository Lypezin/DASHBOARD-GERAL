'use client';

import React from 'react';
import { Organization } from '@/hooks/auth/useOrganizations'; // Keep this for the type definition
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganizations } from '@/hooks/auth/useOrganizations'; // New import
import { useOrganizationSelection } from '@/hooks/auth/useOrganizationSelection'; // New import

interface AdminOrganizationsTableProps {
  organizations: Organization[];
  onEdit: (org: Organization) => void;
  onToggleActive: (org: Organization) => void;
}

export const AdminOrganizationsTable: React.FC<AdminOrganizationsTableProps> = ({
  organizations,
  onEdit,
  onToggleActive,
}) => {
  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Nenhuma organização cadastrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Slug</th>
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Usuários</th>
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Limite</th>
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="pb-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Criada em</th>
              <th className="pb-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{org.name}</td>
                <td className="py-3 px-4">
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {org.slug}
                  </code>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{org.user_count || 0}</span>
                </td>
                <td className="py-3 px-4">{org.max_users}</td>
                <td className="py-3 px-4">
                  <Badge variant={org.is_active ? 'default' : 'secondary'}>
                    {org.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                  {new Date(org.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(org)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={org.is_active ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => onToggleActive(org)}
                    >
                      {org.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

