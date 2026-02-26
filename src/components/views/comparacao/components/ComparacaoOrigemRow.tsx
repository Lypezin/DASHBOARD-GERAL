
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { VariacaoBadge } from '@/components/VariacaoBadge';

interface ComparacaoOrigemRowProps {
    origem: string;
    index: number;
    semanasSelecionadas: (number | string)[];
    dadosPorOrigem: Record<string, Record<number, number>>;
}

export const ComparacaoOrigemRow = React.memo(({ origem, index, semanasSelecionadas, dadosPorOrigem }: ComparacaoOrigemRowProps) => {
    return (
        <TableRow
            className={`${index % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/30'} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800`}
        >
            <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 font-medium text-sm text-slate-800 dark:text-slate-200 pl-5 border-r border-slate-100 dark:border-slate-800 py-3">
                {origem}
            </TableCell>
            {semanasSelecionadas.map((_, idx) => {
                const valor = dadosPorOrigem[origem][idx];
                let variacao: number | null = null;

                if (idx > 0) {
                    const valorAnterior = dadosPorOrigem[origem][idx - 1];
                    if (valorAnterior > 0) {
                        variacao = ((valor - valorAnterior) / valorAnterior) * 100;
                    } else if (valor > 0) {
                        variacao = 100;
                    } else {
                        variacao = 0;
                    }
                }

                return (
                    <React.Fragment key={idx}>
                        <TableCell className="text-center text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800 py-3">
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center w-[70px] py-2">
                            {idx > 0 ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto" />
                            ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoOrigemRow.displayName = 'ComparacaoOrigemRow';
