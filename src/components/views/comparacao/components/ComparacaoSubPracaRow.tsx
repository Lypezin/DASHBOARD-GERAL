import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { VariacaoBadge } from '@/components/VariacaoBadge';

export interface SubPracaMetric {
    aderencia: number;
    entregue: string;
    meta: string;
}

interface ComparacaoSubPracaRowProps {
    subPraca: string;
    index: number;
    semanasSelecionadas: (number | string)[];
    dadosPorSubPraca: Record<string, Record<number, SubPracaMetric>>;
}

export const ComparacaoSubPracaRow = React.memo(({ subPraca, index, semanasSelecionadas, dadosPorSubPraca }: ComparacaoSubPracaRowProps) => {
    return (
        <TableRow
            className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'} hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors`}
        >
            <TableCell className="font-medium text-slate-700 dark:text-slate-300 pl-6 border-r border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
                {subPraca}
            </TableCell>
            {semanasSelecionadas.map((_, idx) => {
                const metric = dadosPorSubPraca[subPraca][idx];
                const valor = metric.aderencia;
                let variacao: number | null = null;
                let isSame = false;

                if (idx > 0) {
                    const metricAnterior = dadosPorSubPraca[subPraca][idx - 1];
                    const valorAnterior = metricAnterior.aderencia;

                    if (valorAnterior > 0) {
                        variacao = ((valor - valorAnterior) / valorAnterior) * 100;
                    } else if (valor > 0) {
                        variacao = 100;
                    } else {
                        variacao = 0;
                    }

                    // Consider essentially the same if diff < 0.1
                    if (Math.abs(valor - valorAnterior) < 0.1) {
                        isSame = true;
                        variacao = 0;
                    }
                }

                return (
                    <React.Fragment key={idx}>
                        {/* Meta */}
                        <TableCell className="text-center text-slate-500 dark:text-slate-400 text-xs border-l border-slate-100 dark:border-slate-800 tabular-nums">
                            {metric.meta}
                        </TableCell>
                        {/* Entregue */}
                        <TableCell className="text-center text-slate-600 dark:text-slate-300 font-medium text-xs tabular-nums">
                            {metric.entregue}
                        </TableCell>
                        {/* Aderência */}
                        <TableCell className="text-center text-slate-700 dark:text-slate-200 font-bold text-xs tabular-nums">
                            {valor.toFixed(1)}%
                        </TableCell>
                        {/* Variação */}
                        <TableCell className="text-center border-r border-slate-200 dark:border-slate-800">
                            {idx > 0 && !isSame ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                            ) : idx > 0 ? (
                                <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                            ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoSubPracaRow.displayName = 'ComparacaoSubPracaRow';
