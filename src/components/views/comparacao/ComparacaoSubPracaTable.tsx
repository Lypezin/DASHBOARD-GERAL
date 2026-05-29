import React from 'react';
import { DashboardResumoData } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ComparacaoSubPracaRow } from './components/ComparacaoSubPracaRow';
import { processSubPracaData } from './utils/processSubPracaData';

interface ComparacaoSubPracaTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoSubPracaTable: React.FC<ComparacaoSubPracaTableProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    const { subPracasOrdenadas, dadosPorSubPraca } = React.useMemo(() => {
        return processSubPracaData(dadosComparacao);
    }, [dadosComparacao]);

    return (
        <div className="w-full">
            <div className="mb-5 flex flex-wrap gap-3 px-6 select-none sm:px-8">
                <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/65">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Meta (H. plan)</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/65">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Entregue (realizado)</span>
                </div>
            </div>

            <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <Table className="min-w-[980px]">
                    <TableHeader>
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead rowSpan={2} className="sticky left-0 z-20 w-[150px] bg-white pb-4 pl-6 align-bottom text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950 dark:text-slate-500 sm:w-[190px] sm:pl-8">
                                Sub-praca
                            </TableHead>
                            {semanasSelecionadas.map((semana) => {
                                const semanaStr = String(semana).replace('W', '');
                                return (
                                    <TableHead key={semana} colSpan={4} className="pb-2 text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                            Semana {semanaStr}
                                        </span>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                        <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-slate-800/50">
                            {semanasSelecionadas.map((semana) => (
                                <React.Fragment key={`subheader-${semana}`}>
                                    <TableHead className="h-10 min-w-[72px] pb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Meta</TableHead>
                                    <TableHead className="h-10 min-w-[72px] pb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Real</TableHead>
                                    <TableHead className="h-10 min-w-[72px] pb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">%</TableHead>
                                    <TableHead className="h-10 min-w-[62px] pb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Var</TableHead>
                                </React.Fragment>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subPracasOrdenadas.map((subPraca, index) => (
                            <ComparacaoSubPracaRow
                                key={subPraca}
                                subPraca={subPraca}
                                index={index}
                                semanasSelecionadas={semanasSelecionadas}
                                dadosPorSubPraca={dadosPorSubPraca}
                            />
                        ))}
                        {subPracasOrdenadas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={semanasSelecionadas.length * 4 + 1} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                    Nenhum dado de sub-praca disponivel para as semanas selecionadas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
