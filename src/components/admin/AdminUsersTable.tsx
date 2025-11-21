import React from 'react';
import { User, UserProfile } from '@/hooks/useAdminData';

interface AdminUsersTableProps {
  users: User[];
  currentUser: UserProfile | null;
  onApprove: (user: User) => void;
  onEditPracas: (user: User) => void;
  onRevokeAccess: (userId: string) => void;
  onToggleAdmin: (userId: string, currentIsAdmin: boolean) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  currentUser,
  onApprove,
  onEditPracas,
  onRevokeAccess,
  onToggleAdmin,
}) => {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
        <span className="text-2xl">👥</span>
        Todos os Usuários ({users.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
              <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
              <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Praças</th>
              <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                    <div className="flex flex-wrap gap-1">
                      {user.is_admin && (
                        <span className="inline-block rounded bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                          Admin
                        </span>
                      )}
                      {user.role === 'marketing' && !user.is_admin && (
                        <span className="inline-block rounded bg-pink-100 dark:bg-pink-900/50 px-2 py-0.5 text-xs font-semibold text-pink-700 dark:text-pink-300">
                          Marketing
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                <td className="py-3">
                  {user.is_approved ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓ Aprovado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      ⏳ Pendente
                    </span>
                  )}
                </td>
                <td className="py-3 text-sm">
                  {user.assigned_pracas && user.assigned_pracas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.assigned_pracas.map((praca) => (
                        <span
                          key={praca}
                          className="rounded bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                        >
                          {praca}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Nenhuma</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {!user.is_admin && !user.is_approved && (
                      <button
                        onClick={() => onApprove(user)}
                        className="rounded bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-900"
                      >
                        Aprovar
                      </button>
                    )}
                    
                    {user.is_approved && !user.is_admin && (
                      <>
                        <button
                          onClick={() => onEditPracas(user)}
                          className="rounded bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900"
                        >
                          Editar Praças
                        </button>
                        <button
                          onClick={() => onRevokeAccess(user.id)}
                          className="rounded bg-rose-100 dark:bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-200 dark:hover:bg-rose-900"
                        >
                          Revogar
                        </button>
                      </>
                    )}
                    
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => onToggleAdmin(user.id, user.is_admin)}
                        className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                          user.is_admin
                            ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900'
                            : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
                        }`}
                      >
                        {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                    )}
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

