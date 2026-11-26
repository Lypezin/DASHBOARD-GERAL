import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const ResetPasswordSuccess = React.memo(function ResetPasswordSuccess() {
    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Senha Atualizada!</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Sua senha foi redefinida com sucesso.
                    Você já pode fazer login com a nova senha.
                </p>
            </div>
            <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-lg transition-colors"
            >
                Ir para o Login
            </Link>
        </div>
    );
});

ResetPasswordSuccess.displayName = 'ResetPasswordSuccess';
