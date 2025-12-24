
import React from 'react';
import Link from 'next/link';

export const RegistroFormFooter = React.memo(function RegistroFormFooter() {
    return (
        <>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-slate-400 font-medium">
                        ou
                    </span>
                </div>
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
