import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateFullName } from '@/utils/perfil/validation';

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
  const [editedName, setEditedName] = useState(user.full_name);
  const { updateFullName, savingName, error, success, setError, setSuccess } = usePerfilUpdate();

  const handleSaveName = async () => {
    const validation = validateFullName(editedName);
    if (!validation.valid) {
      setError(validation.error || 'Nome inválido');
      return;
    }

    if (editedName.trim() === user.full_name) {
      setIsEditingName(false);
      return;
    }

    await updateFullName(editedName, user.id, () => {
      setIsEditingName(false);
      onProfileUpdate();
    });
  };

  const handleCancelEditName = () => {
    setEditedName(user.full_name);
    setIsEditingName(false);
    setError(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
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
            <div className="space-y-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={savingName}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                placeholder="Digite seu nome"
                maxLength={100}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {savingName ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Salvar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEditName}
                  disabled={savingName}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
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
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            E-mail
          </label>
          <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
            {user.email}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            O e-mail não pode ser alterado
          </p>
        </div>
        {memberSince && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Membro desde
            </label>
            <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-4 py-3 text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className="font-medium">{formatDate(memberSince)}</span>
              </div>
            </div>
          </div>
        )}
        {user.is_admin && (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md">
              <span>⭐</span>
              <span>Administrador</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

