import React from 'react';
import { User } from '@/hooks/useAdminData';

interface AdminEditModalProps {
  user: User;
  pracasDisponiveis: string[];
  selectedPracas: string[];
  selectedRole: 'admin' | 'marketing' | 'user';
  onPracasChange: (pracas: string[]) => void;
  onRoleChange: (role: 'admin' | 'marketing' | 'user') => void;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  user,
  pracasDisponiveis,
  selectedPracas,
  selectedRole,
  onPracasChange,
  onRoleChange,
  onSave,
  onCancel,
  loading = false,
}) => {
  const togglePracaSelection = (praca: string) => {
    if (selectedPracas.includes(praca)) {
      onPracasChange(selectedPracas.filter((p) => p !== praca));
    } else {
      onPracasChange([...selectedPracas, praca]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>✏️</span>
            Editar Praças
          </h3>
          <div className="mt-2 text-blue-100">
            <p className="font-medium">{user.full_name}</p>
            <p className="text-sm opacity-90">{user.email}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cargo:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value as 'admin' | 'marketing' | 'user')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
              >
                <option value="user">Usuário</option>
                <option value="marketing">Marketing</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedRole === 'marketing' && 'Marketing tem acesso a todas as cidades, mas sem privilégios de admin'}
                {selectedRole === 'admin' && 'Administrador tem acesso total ao sistema'}
                {selectedRole === 'user' && 'Usuário comum com acesso apenas às praças selecionadas'}
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selecione as praças:</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedPracas.length} de {pracasDisponiveis.length} selecionadas
              </span>
            </div>
            
            {pracasDisponiveis.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-4xl mb-2 block">🏢</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma praça disponível</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Verifique a conexão ou tente recarregar</p>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
                {pracasDisponiveis.map((praca) => (
                  <label
                    key={praca}
                    className="flex items-center gap-3 rounded-lg border border-transparent p-3 cursor-pointer transition-all hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPracas.includes(praca)}
                      onChange={() => togglePracaSelection(praca)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {praca}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 py-3 font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={loading || (selectedRole !== 'marketing' && selectedPracas.length === 0)}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 shadow-lg"
            >
              {loading ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

