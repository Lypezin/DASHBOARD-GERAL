import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateFullName } from '@/utils/perfil/validation';

interface PerfilNameEditorProps {
    currentName: string;
    userId: string;
    onProfileUpdate: () => void;
    onCancel: () => void;
    setError: (error: string | null) => void;
}

export const PerfilNameEditor: React.FC<PerfilNameEditorProps> = ({
    currentName,
    userId,
    onProfileUpdate,
    onCancel,
    setError,
}) => {
    const [editedName, setEditedName] = useState(currentName);
    const { updateFullName, savingName } = usePerfilUpdate();

    const handleSaveName = async () => {
        const validation = validateFullName(editedName);
        if (!validation.valid) {
            setError(validation.error || 'Nome inválido');
            return;
        }

        if (editedName.trim() === currentName) {
            onCancel();
            return;
        }

        await updateFullName(editedName, userId, () => {
            onCancel();
            onProfileUpdate();
        });
    };

    return (
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
                    onClick={onCancel}
                    disabled={savingName}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};
