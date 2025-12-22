import React from 'react';
import { Entregador } from '@/types';
import { Badge } from '@/components/ui/badge';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';

interface EntregadoresTableRowProps {
    entregador: Entregador;
}

export const EntregadoresMainTableRow = React.memo(function EntregadoresMainTableRow({
    entregador
}: EntregadoresTableRowProps) {
    return (
        <div className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[1000px]">
            <div className="col-span-2">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {entregador.nome_entregador}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {entregador.id_entregador}
                </div>
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.corridas_ofertadas || 0).toLocaleString()}
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.corridas_aceitas || 0).toLocaleString()}
            </div>
            <div className="text-center">
                <Badge variant="outline" className="font-normal">
                    {calcularPercentualAceitas(entregador).toFixed(1)}%
                </Badge>
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                {(entregador.corridas_completadas || 0).toLocaleString()}
            </div>
            <div className="text-center">
                <Badge variant="outline" className="font-normal">
                    {calcularPercentualCompletadas(entregador).toFixed(1)}%
                </Badge>
            </div>
            <div className="text-center">
                <Badge
                    variant="outline"
                    className={`font-medium ${entregador.aderencia_percentual >= 90
                        ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                        : entregador.aderencia_percentual >= 70
                            ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
                        }`}
                >
                    {(entregador.aderencia_percentual || 0).toFixed(1)}%
                </Badge>
            </div>
        </div>
    );
});
