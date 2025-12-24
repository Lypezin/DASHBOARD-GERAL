
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
            className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
        >
            <TableCell className="font-medium text-slate-700 dark:text-slate-300 pl-6">
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
                        <TableCell className="text-center text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800">
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
