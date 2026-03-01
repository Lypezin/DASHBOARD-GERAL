import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { METRICAS, formatVariation, getValorOrigem } from './helpers/comparacaoOrigemHelpers';

interface ComparacaoOrigemDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoOrigemDetalhada: React.FC<ComparacaoOrigemDetalhadaProps> = ({ dadosComparacao, semanasSelecionadas, }) => {
    if (!dadosComparacao || dadosComparacao.length === 0) return null;

    const todasOrigens = new Set<string>();
    dadosComparacao.forEach((d) => d.aderencia_origem?.forEach((o) => todasOrigens.add(o.origem)));
    const origens = Array.from(todasOrigens).sort();

    if (origens.length === 0) return null;
    const showVariation = dadosComparacao.length >= 2;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Análise Detalhada por Origem</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {origens.map((origem) => (
                    <div key={origem}>
                        <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-800/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{origem}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent bg-transparent">
                                        <TableHead className="sticky left-0 z-20 bg-white dark:bg-slate-900 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-5 min-w-[160px] border-r border-slate-100 dark:border-slate-800">
                                            Métrica
                                        </TableHead>
                                        {semanasSelecionadas.map((semana) => (
                                            <TableHead key={semana} className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800 min-w-[100px]">
                                                Sem. {String(semana).replace('W', '')}
                                            </TableHead>
                                        ))}
                                        {showVariation && (
                                            <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-[80px]">
                                                Var.
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {METRICAS.map((metrica, mIdx) => {
                                        const valores = dadosComparacao.map((_, idx) => getValorOrigem(dadosComparacao, idx, origem, metrica.campo));
                                        return (
                                            <TableRow key={metrica.campo} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${mIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-800/10'}`}>
                                                <TableCell className="sticky left-0 z-10 bg-inherit pl-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 min-w-[160px]">
                                                    {metrica.label}
                                                </TableCell>
                                                {valores.map((val, idx) => (
                                                    <TableCell key={idx} className="text-center py-2.5 text-sm tabular-nums text-slate-700 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800">
                                                        {metrica.format(val)}
                                                    </TableCell>
                                                ))}
                                                {showVariation && (
                                                    <TableCell className="text-center py-2.5">
                                                        {formatVariation(valores[0], valores[valores.length - 1], metrica.isPercent)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
