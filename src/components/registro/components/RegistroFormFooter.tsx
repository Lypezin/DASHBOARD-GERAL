
import React from 'react';
import Link from 'next/link';

export const RegistroFormFooter = React.memo(function RegistroFormFooter() {
    return (
        <>
            <div className="mt-6 border-t border-border pt-5 text-center">
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
