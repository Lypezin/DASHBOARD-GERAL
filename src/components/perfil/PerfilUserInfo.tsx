import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { PerfilNameEditor } from './components/PerfilNameEditor';
import { PerfilInfoFields } from './components/PerfilInfoFields';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

interface PerfilUserInfoProps {
  user: UserProfile;
  memberSince: string | null;
  onProfileUpdate: () => void;
}

export const PerfilUserInfo: React.FC<PerfilUserInfoProps> = ({
  user,
  memberSince,
  onProfileUpdate,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const { error, success, setError } = usePerfilUpdate();

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setError(null);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Informações da Conta</h2>
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-semibold">⚠️ Erro</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-semibold">✅ Sucesso</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nome Completo
          </label>
          {isEditingName ? (
            <PerfilNameEditor
              currentName={user.full_name}
              userId={user.id}
              onProfileUpdate={onProfileUpdate}
              onCancel={handleCancelEditName}
              setError={setError}
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                {user.full_name}
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                title="Editar nome"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Editar</span>
              </button>
            </div>
          )}
        </div>

        <PerfilInfoFields
          email={user.email}
          memberSince={memberSince}
          isAdmin={user.is_admin}
        />
      </div>
    </div>
  );
};
