import React from 'react';

export const LoginHeader = React.memo(function LoginHeader() {
    return (
        <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-800">Bem-vindo de volta</h2>
            <p className="text-sm font-medium text-slate-500">Entre com suas credenciais para continuar</p>
        </div>
    );
});

LoginHeader.displayName = 'LoginHeader';
