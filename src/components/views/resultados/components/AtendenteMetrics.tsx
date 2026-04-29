import React from 'react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetricsProps {
    atendenteData: AtendenteData;
}

export const AtendenteMetrics = ({ atendenteData }: AtendenteMetricsProps) => {
    return (
        <div className="flex items-center gap-6">
            <div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Enviado</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums leading-tight">
                    {atendenteData.enviado.toLocaleString('pt-BR')}
                </p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Liberado</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums leading-tight">
                    {atendenteData.liberado.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
