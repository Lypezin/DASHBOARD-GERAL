
import React from 'react';
import Link from 'next/link';

export const RegistroFormFooter = React.memo(function RegistroFormFooter() {
    return (
        <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="font-medium">ou</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="text-center">
                <p className="text-sm text-slate-500">
                    Já tem uma conta?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                        Fazer login
                    </Link>
                </p>
            </div>
        </>
    );
});
