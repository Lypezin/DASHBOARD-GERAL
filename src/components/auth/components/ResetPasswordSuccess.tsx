import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const ResetPasswordSuccess = React.memo(function ResetPasswordSuccess() {
    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha Atualizada!</h2>
                <p className="text-slate-500">
                    Sua senha foi redefinida com sucesso.
                    Você já pode fazer login com a nova senha.
                </p>
            </div>
            <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-md bg-[#0754d8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0647b7]"
            >
                Ir para o Login
            </Link>
        </div>
    );
});

ResetPasswordSuccess.displayName = 'ResetPasswordSuccess';
