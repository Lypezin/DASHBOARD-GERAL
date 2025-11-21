import React from 'react';

interface User {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface AdminPendingUsersProps {
  pendingUsers: User[];
  onApprove: (user: User) => void;
}

export const AdminPendingUsers: React.FC<AdminPendingUsersProps> = ({
  pendingUsers,
  onApprove,
}) => {
  if (pendingUsers.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
        <span className="text-2xl">⏳</span>
        Usuários Aguardando Aprovação ({pendingUsers.length})
      </h2>
      <div className="space-y-4">
        {pendingUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => onApprove(user)}
              className="rounded-lg bg-emerald-600 dark:bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              Aprovar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

