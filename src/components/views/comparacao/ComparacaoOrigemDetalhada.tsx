import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { METRICAS, formatVariation, getValorOrigem } from './helpers/comparacaoOrigemHelpers';

interface ComparacaoOrigemDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoOrigemDetalhada: React.FC<ComparacaoOrigemDetalhadaProps> = ({ dadosComparacao, semanasSelecionadas }) => {
    if (!dadosComparacao || dadosComparacao.length === 0) return null;

    const todasOrigens = new Set<string>();
    dadosComparacao.forEach((d) => d.aderencia_origem?.forEach((o) => todasOrigens.add(o.origem)));
    const origens = Array.from(todasOrigens).sort();

    if (origens.length === 0) return null;
    const showVariation = dadosComparacao.length >= 2;

    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] dark:border-slate-800/80 dark:bg-slate-950/76">
            <div className="border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
                <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Analise detalhada por origem</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {origens.map((origem) => (
                    <div key={origem}>
                        <div className="bg-slate-50/80 px-6 py-2.5 dark:bg-slate-900/65">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{origem}</p>
                        </div>
                        <div className="subtle-scrollbar overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent hover:bg-transparent">
                                        <TableHead className="sticky left-0 z-20 min-w-[170px] border-r border-slate-100 bg-white pl-6 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
                                            Metrica
                                        </TableHead>
                                        {semanasSelecionadas.map((semana) => (
                                            <TableHead key={semana} className="min-w-[108px] border-l border-slate-100 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                                Sem. {String(semana).replace('W', '')}
                                            </TableHead>
                                        ))}
                                        {showVariation && (
                                            <TableHead className="min-w-[88px] text-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                Var.
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {METRICAS.map((metrica, mIdx) => {
                                        const valores = dadosComparacao.map((_, idx) => getValorOrigem(dadosComparacao, idx, origem, metrica.campo));
                                        return (
                                            <TableRow key={metrica.campo} className={`hover:bg-slate-50/60 dark:hover:bg-slate-900/55 ${mIdx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/35 dark:bg-slate-900/35'}`}>
                                                <TableCell className="sticky left-0 z-10 min-w-[170px] border-r border-slate-100 bg-inherit pl-6 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                                    {metrica.label}
                                                </TableCell>
                                                {valores.map((val, idx) => (
                                                    <TableCell key={idx} className="border-l border-slate-100 py-3 text-center text-sm text-slate-700 tabular-nums dark:border-slate-800 dark:text-slate-200">
                                                        {metrica.format(val)}
                                                    </TableCell>
                                                ))}
                                                {showVariation && (
                                                    <TableCell className="py-3 text-center">
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
