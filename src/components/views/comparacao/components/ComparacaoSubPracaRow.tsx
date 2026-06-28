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
            className={`group border-b border-transparent transition-all duration-200 hover:bg-slate-50/60 dark:hover:bg-slate-900/55
                ${index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/35 dark:bg-slate-900/30'}`}
        >
            <TableCell className="sticky left-0 z-10 bg-inherit py-[18px] pl-6 text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-300 sm:pl-8">
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
                        <TableCell className="py-[18px] text-center font-mono text-[13px] font-medium text-slate-500 tabular-nums transition-colors group-hover:bg-white/50 dark:text-slate-400 dark:group-hover:bg-transparent">
                            {metric.meta}
                        </TableCell>
                        <TableCell className="py-[18px] text-center font-mono text-sm font-semibold text-slate-700 tabular-nums transition-colors group-hover:bg-white/50 dark:text-slate-300 dark:group-hover:bg-transparent">
                            {metric.entregue}
                        </TableCell>
                        <TableCell className="py-[18px] text-center text-sm font-black text-slate-900 tabular-nums transition-colors group-hover:bg-white/50 dark:text-white dark:group-hover:bg-transparent">
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="py-[18px] text-center">
                            {idx > 0 && !isSame ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto" />
                            ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoSubPracaRow.displayName = 'ComparacaoSubPracaRow';
