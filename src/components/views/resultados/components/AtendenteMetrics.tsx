import React from 'react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetricsProps {
    atendenteData: AtendenteData;
}

export const AtendenteMetrics = ({ atendenteData }: AtendenteMetricsProps) => {
    return (
        <div className="flex items-center gap-8">
            <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Enviado</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tabular-nums leading-none">
                    {atendenteData.enviado.toLocaleString('pt-BR')}
                </p>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Liberado</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tabular-nums leading-none">
                    {atendenteData.liberado.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
