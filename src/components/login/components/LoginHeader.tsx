import React from 'react';

export const LoginHeader = React.memo(function LoginHeader() {
    return (
        <div className="mb-8 text-left">
            <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h1>
            <p className="text-sm font-medium text-muted-foreground">Entre com suas credenciais para continuar</p>
        </div>
    );
});

LoginHeader.displayName = 'LoginHeader';
