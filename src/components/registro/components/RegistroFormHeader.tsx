
import React from 'react';

export const RegistroFormHeader = React.memo(function RegistroFormHeader() {
    return (
        <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-800">Seus Dados</h2>
            <p className="text-sm font-medium text-slate-500">Preencha os campos para criar sua conta</p>
        </div>
    );
});
