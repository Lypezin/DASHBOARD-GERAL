import React from 'react';
import { EntregadorMarketing } from '@/types';

interface EntregadoresTableRowProps {
    entregador: EntregadorMarketing;
    formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresTableRow = React.memo(function EntregadoresTableRow({
    entregador,
    formatarSegundosParaHoras
}: EntregadoresTableRowProps) {
    return (
        <div className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[1000px]">
            <div className="col-span-2">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {entregador.nome}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {entregador.id_entregador}
                </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                {entregador.regiao_atuacao || '-'}
            </div>
            <div className="text-center text-sm font-mono text-slate-600 dark:text-slate-400">
                {formatarSegundosParaHoras(entregador.total_segundos || 0)}
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.total_ofertadas || 0).toLocaleString()}
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.total_aceitas || 0).toLocaleString()}
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.total_rejeitadas || 0).toLocaleString()}
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.total_completadas || 0).toLocaleString()}
            </div>
        </div>
    );
});
