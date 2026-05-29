import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { ValoresEntregador } from '@/types';

interface ValoresTableRowProps {
    entregador: ValoresEntregador;
    ranking: number;
    formatarReal: (valor: number | null | undefined) => string;
    isDetailed?: boolean;
}

export const ValoresTableRow = React.memo(({ entregador, ranking, formatarReal, isDetailed }: ValoresTableRowProps) => {
    const totalTaxas = Number(entregador.total_taxas) || 0;
    const numeroCorridas = Number(entregador.numero_corridas_aceitas) || 0;
    const taxaMedia = Number(entregador.taxa_media) || 0;
    const nomeEntregador = String(entregador.nome_entregador || entregador.id_entregador || 'N/A');

    return (
        <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
            <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {ranking}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{nomeEntregador}</span>
                </div>
            </TableCell>
            {isDetailed && (
                <>
                    <TableCell className="py-4">
                        <span className="text-sm text-slate-500">{entregador.turno || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                        <span className="text-sm text-slate-500 truncate max-w-[150px] block" title={entregador.sub_praca || ''}>
                            {entregador.sub_praca || '-'}
                        </span>
                    </TableCell>
                </>
            )}
            <TableCell className="text-right py-4">
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatarReal(totalTaxas)}
                </span>
            </TableCell>
            <TableCell className="text-right py-4">
                <span className="text-slate-600 dark:text-slate-400 text-sm">
                    {numeroCorridas.toLocaleString('pt-BR')}
                </span>
            </TableCell>
            <TableCell className="text-right py-4 pr-6">
                <span className="font-mono text-slate-600 dark:text-slate-400 text-sm">
                    {formatarReal(taxaMedia)}
                </span>
            </TableCell>
        </TableRow>
    );
});

ValoresTableRow.displayName = 'ValoresTableRow';
