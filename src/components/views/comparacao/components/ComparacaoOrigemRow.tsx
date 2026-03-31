
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
            className={`
                group transition-all duration-200 border-b border-transparent
                ${origem === 'MÉDIA DAS ORIGENS'
                    ? 'bg-indigo-50/40 dark:bg-indigo-900/10 font-bold'
                    : index % 2 === 0 ? '' : 'bg-slate-50/20 dark:bg-slate-900/10'
                } 
                hover:bg-slate-50 dark:hover:bg-slate-800/20
            `}
        >
            <TableCell className={`sticky left-0 z-10 font-semibold text-[13px] pl-8 py-5 transition-colors
                ${origem === 'MÉDIA DAS ORIGENS'
                    ? 'bg-indigo-50/10 dark:bg-slate-900 text-indigo-700 dark:text-indigo-400'
                    : 'bg-inherit text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
            `}>
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
                        <TableCell className={`text-center text-[13px] font-mono tabular-nums text-slate-700 dark:text-slate-300 py-5`}>
                            {origem === 'MÉDIA DAS ORIGENS' && <span className="text-indigo-500/50 dark:text-indigo-400/50 mr-1">~</span>}
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center w-[70px] py-5">
                            {idx > 0 ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                            ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoOrigemRow.displayName = 'ComparacaoOrigemRow';
