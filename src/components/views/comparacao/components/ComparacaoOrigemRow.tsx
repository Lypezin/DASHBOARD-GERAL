
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
            className={`${index % 2 === 0 ? 'bg-white/70 dark:bg-slate-900/70' : 'bg-slate-50/60 dark:bg-slate-900/40'} hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all border-b border-slate-200/30 dark:border-slate-700/30`}
        >
            <TableCell className="sticky left-0 z-10 bg-inherit backdrop-blur-sm font-semibold text-slate-800 dark:text-slate-200 pl-4 sm:pl-6 border-r border-slate-200/50 dark:border-slate-700/50 text-sm">
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
                        <TableCell className="text-center text-slate-700 dark:text-slate-200 font-semibold border-l border-slate-200/30 dark:border-slate-700/30 text-sm">
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
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
