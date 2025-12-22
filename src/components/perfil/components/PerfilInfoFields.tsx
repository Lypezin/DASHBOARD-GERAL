import React from 'react';

interface PerfilInfoFieldsProps {
    email: string;
    memberSince: string | null;
    isAdmin: boolean;
}

export const PerfilInfoFields: React.FC<PerfilInfoFieldsProps> = ({
    email,
    memberSince,
    isAdmin,
}) => {
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
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                </label>
                <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                    {email}
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
            {isAdmin && (
                <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                        <span>⭐</span>
                        <span>Administrador</span>
                    </span>
                </div>
            )}
        </>
    );
};
