
import React from 'react';

export const RegistroFormHeader = React.memo(function RegistroFormHeader() {
    return (
        <div className="mb-6 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Criar Conta</h1>
            <p className="mt-1 text-sm font-semibold text-foreground">Seus Dados</p>
            <p className="text-sm text-muted-foreground">Preencha os campos para criar sua conta</p>
        </div>
    );
});
