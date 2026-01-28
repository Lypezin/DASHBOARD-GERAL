import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetricsProps {
    atendenteData: AtendenteData;
}

export const AtendenteMetrics = ({ atendenteData }: AtendenteMetricsProps) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 border border-emerald-100/50 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                    <Send className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Enviado</p>
                </div>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    {atendenteData.enviado.toLocaleString('pt-BR')}
                </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3 border border-blue-100/50 dark:border-blue-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Liberado</p>
                </div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">
                    {atendenteData.liberado.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
