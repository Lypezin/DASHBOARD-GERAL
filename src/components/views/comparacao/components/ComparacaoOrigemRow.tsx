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
    const isAverageRow = origem === 'MEDIA DAS ORIGENS';

    return (
        <TableRow
            className={`
                group border-b border-transparent transition-all duration-200
                ${isAverageRow
                    ? 'bg-sky-50/70 font-bold dark:bg-sky-950/18'
                    : index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/35 dark:bg-slate-900/30'}
                hover:bg-slate-50/70 dark:hover:bg-slate-900/55
            `}
        >
            <TableCell className={`sticky left-0 z-10 py-4 pl-6 text-[13px] font-semibold transition-colors sm:pl-8
                ${isAverageRow
                    ? 'bg-sky-50/90 text-sky-700 dark:bg-slate-950 dark:text-sky-300'
                    : 'bg-inherit text-slate-800 group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-300'}
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
                        <TableCell className="py-4 text-center font-mono text-[13px] text-slate-700 tabular-nums dark:text-slate-300">
                            {isAverageRow && <span className="mr-1 text-sky-500/60 dark:text-sky-300/60">~</span>}
                            {valor.toFixed(1)}%
                        </TableCell>
                        <TableCell className="w-[72px] py-4 text-center">
                            {idx > 0 ? (
                                <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                            ) : (
                                <span className="font-mono text-xs text-slate-300 dark:text-slate-600">-</span>
                            )}
                        </TableCell>
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
});

ComparacaoOrigemRow.displayName = 'ComparacaoOrigemRow';
