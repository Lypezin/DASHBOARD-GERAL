import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetricsProps {
    atendenteData: AtendenteData;
}

export const AtendenteMetrics = ({ atendenteData }: AtendenteMetricsProps) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                    <Send className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Enviado</p>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {atendenteData.enviado.toLocaleString('pt-BR')}
                </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Liberado</p>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {atendenteData.liberado.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
