
import React from 'react';
import { ValoresEntregador } from '@/types';

interface ValoresTableRowProps {
    entregador: ValoresEntregador;
    ranking: number;
    formatarReal: (valor: number | null | undefined) => string;
}

export const ValoresTableRow = React.memo(({ entregador, ranking, formatarReal }: ValoresTableRowProps) => {
    const totalTaxas = Number(entregador.total_taxas) || 0;
    const numeroCorridas = Number(entregador.numero_corridas_aceitas) || 0;
    const taxaMedia = Number(entregador.taxa_media) || 0;
    const nomeEntregador = String(entregador.nome_entregador || entregador.id_entregador || 'N/A');

    return (
        <div
            className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[600px]"
        >
            <div className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {ranking}
                </span>
                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{nomeEntregador}</span>
            </div>
            <div className="text-right">
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatarReal(totalTaxas)}
                </span>
            </div>
            <div className="text-right">
                <span className="text-slate-600 dark:text-slate-400 text-sm">
                    {numeroCorridas.toLocaleString('pt-BR')}
                </span>
            </div>
            <div className="text-right">
                <span className="font-mono text-slate-600 dark:text-slate-400 text-sm">
                    {formatarReal(taxaMedia)}
                </span>
            </div>
        </div>
    );
});

ValoresTableRow.displayName = 'ValoresTableRow';
