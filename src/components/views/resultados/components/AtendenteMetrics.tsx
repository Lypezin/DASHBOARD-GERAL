import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetricsProps {
    atendenteData: AtendenteData;
}

export const AtendenteMetrics = ({ atendenteData }: AtendenteMetricsProps) => {
    return (
        <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                    <Send className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enviado</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                    {atendenteData.enviado.toLocaleString('pt-BR')}
                </p>
            </div>
            <div className="rounded-lg bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3 w-3 text-blue-500/80 dark:text-blue-400/80" />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liberado</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                    {atendenteData.liberado.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
