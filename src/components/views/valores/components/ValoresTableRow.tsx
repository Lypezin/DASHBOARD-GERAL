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
        <TableRow
            className="border-b border-[#e7eef3] transition-colors duration-150 hover:bg-[#f5fafd] dark:border-slate-800 dark:hover:bg-slate-800/50"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '60px' }}
        >
            <TableCell className="py-3 pl-4">
                <div className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef4f7] text-[11px] font-semibold text-[#55758a] dark:bg-slate-800 dark:text-slate-300">
                        {ranking}
                    </span>
                    <span className="max-w-[240px] truncate font-medium text-slate-800 dark:text-slate-100">{nomeEntregador}</span>
                </div>
            </TableCell>
            {isDetailed && (
                <>
                    <TableCell className="py-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{entregador.turno || '-'}</span>
                    </TableCell>
                    <TableCell className="py-3">
                        <span className="block max-w-[150px] truncate text-sm text-slate-500 dark:text-slate-400" title={entregador.sub_praca || ''}>
                            {entregador.sub_praca || '-'}
                        </span>
                    </TableCell>
                </>
            )}
            <TableCell className="py-3 text-right">
                <span className="font-mono font-semibold tabular-nums text-[#1c5e81] dark:text-sky-200">
                    {formatarReal(totalTaxas)}
                </span>
            </TableCell>
            <TableCell className="py-3 text-right">
                <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {numeroCorridas.toLocaleString('pt-BR')}
                </span>
            </TableCell>
            <TableCell className="py-3 pr-4 text-right">
                <span className="font-mono text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {formatarReal(taxaMedia)}
                </span>
            </TableCell>
        </TableRow>
    );
});

ValoresTableRow.displayName = 'ValoresTableRow';
