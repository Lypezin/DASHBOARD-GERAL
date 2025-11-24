import React from 'react';

interface AdminHeaderProps {
  totalUsers: number;
  pendingUsers: number;
  totalOrganizations?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  totalUsers,
  pendingUsers,
  totalOrganizations,
}) => {
  return (
    <div className="mb-8">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-white">
            <h1 className="text-2xl lg:text-3xl font-bold">👑 Painel Administrativo</h1>
            <p className="mt-2 text-sm lg:text-base text-indigo-100">Gerenciamento completo de usuários, organizações e permissões</p>
          </div>
          
          <div className={`grid gap-4 lg:gap-6 ${totalOrganizations !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
              <p className="text-2xl lg:text-3xl font-bold text-white">{totalUsers}</p>
              <p className="text-xs lg:text-sm text-indigo-100">Total de Usuários</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
              <p className="text-2xl lg:text-3xl font-bold text-white">{pendingUsers}</p>
              <p className="text-xs lg:text-sm text-indigo-100">Pendentes</p>
            </div>
            {totalOrganizations !== undefined && (
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl lg:text-3xl font-bold text-white">{totalOrganizations}</p>
                <p className="text-xs lg:text-sm text-indigo-100">Organizações</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

