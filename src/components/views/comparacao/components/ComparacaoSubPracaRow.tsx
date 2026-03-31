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
            className={`group transition-all duration-200 border-b border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30
                ${index % 2 === 0 ? '' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}
        >
            <TableCell className="sticky left-0 z-10 bg-inherit font-semibold text-[13px] text-slate-800 dark:text-slate-200 pl-8 py-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
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

                    if (Math.abs(valor - valorAnterior) < 0.1) {
                        isSame = true;
                        variacao = 0;
                    }
                }

                return (
                    <React.Fragment key={idx}>
                        <TableCell className="text-center text-slate-500 dark:text-slate-400 font-mono text-xs tabular-nums group-hover:bg-white/50 dark:group-hover:bg-transparent transition-colors">
                            {metric.meta}
                        </TableCell>
                        <TableCell className="text-center text-slate-700 dark:text-slate-300 font-mono text-[13px] tabular-nums group-hover:bg-white/50 dark:group-hover:bg-transparent transition-colors">
                            {metric.entregue}
                        </TableCell>
                        <TableCell className="text-center font-bold text-[13px] tabular-nums text-slate-900 dark:text-white group-hover:bg-white/50 dark:group-hover:bg-transparent transition-colors">
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                            {idx > 0 && !isSame ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                            ) : idx > 0 ? (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                            ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoSubPracaRow.displayName = 'ComparacaoSubPracaRow';
