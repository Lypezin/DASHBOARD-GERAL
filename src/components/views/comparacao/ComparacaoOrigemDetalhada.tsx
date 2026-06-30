import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { METRICAS, formatVariation, getValorOrigemItem } from './helpers/comparacaoOrigemHelpers';
import type { OrigemMetricItem } from './helpers/comparacaoOrigemHelpers';

interface ComparacaoOrigemDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoOrigemDetalhada = React.memo(function ComparacaoOrigemDetalhada({
    dadosComparacao,
    semanasSelecionadas,
}: ComparacaoOrigemDetalhadaProps) {
    const { origens, origemIndex } = React.useMemo(() => {
        const index = new Map<string, Record<number, OrigemMetricItem>>();
        if (!dadosComparacao || dadosComparacao.length === 0) {
            return { origens: [] as string[], origemIndex: index };
        }

        dadosComparacao.forEach((d, semanaIndex) => {
            d.aderencia_origem?.forEach((origemData) => {
                if (!origemData.origem) return;
                const current = index.get(origemData.origem) ?? {};
                current[semanaIndex] = origemData;
                index.set(origemData.origem, current);
            });
        });

        return { origens: Array.from(index.keys()).sort(), origemIndex: index };
    }, [dadosComparacao]);

    if (origens.length === 0) return null;

    const showVariation = dadosComparacao.length >= 2;

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_58px_-46px_rgba(15,23,42,0.42)] dark:border-slate-800/80 dark:bg-slate-950/80 sm:rounded-[1.65rem]">
            <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800/70 sm:px-6 sm:py-4">
                <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Analise detalhada por origem</h3>
                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">{origens.length} origens comparadas</p>
            </div>

            <div className="max-h-[72vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {origens.map((origem) => (
                    <div key={origem}>
                        <div className="sticky top-0 z-30 bg-slate-50/95 px-4 py-2.5 backdrop-blur dark:bg-slate-900/90 sm:px-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{origem}</p>
                        </div>

                        <div className="subtle-scrollbar overflow-x-auto">
                            <Table className="min-w-[560px]">
                                <TableHeader>
                                    <TableRow className="bg-transparent hover:bg-transparent">
                                        <TableHead className="sticky left-0 z-20 min-w-[150px] border-r border-slate-100 bg-white pl-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 sm:min-w-[170px] sm:pl-6 sm:text-[11px]">
                                            Metrica
                                        </TableHead>
                                        {semanasSelecionadas.map((semana) => (
                                            <TableHead key={semana} className="min-w-[96px] border-l border-slate-100 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:min-w-[108px] sm:text-[11px]">
                                                Sem. {String(semana).replace('W', '')}
                                            </TableHead>
                                        ))}
                                        {showVariation && (
                                            <TableHead className="min-w-[78px] text-center text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:min-w-[88px] sm:text-[11px]">
                                                Var.
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {METRICAS.map((metrica, metricIndex) => {
                                        const origemPorSemana = origemIndex.get(origem);
                                        const valores = dadosComparacao.map((_, index) => getValorOrigemItem(origemPorSemana?.[index], metrica.campo));
                                        return (
                                            <TableRow
                                                key={metrica.campo}
                                                className={`hover:bg-slate-50/60 dark:hover:bg-slate-900/55 ${metricIndex % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/35 dark:bg-slate-900/35'}`}
                                            >
                                                <TableCell className="sticky left-0 z-10 min-w-[150px] border-r border-slate-100 bg-inherit py-2.5 pl-4 text-xs font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:min-w-[170px] sm:py-3 sm:pl-6 sm:text-sm">
                                                    {metrica.label}
                                                </TableCell>
                                                {valores.map((value, index) => (
                                                    <TableCell key={index} className="border-l border-slate-100 py-2.5 text-center text-xs tabular-nums text-slate-700 dark:border-slate-800 dark:text-slate-200 sm:py-3 sm:text-sm">
                                                        {metrica.format(value)}
                                                    </TableCell>
                                                ))}
                                                {showVariation ? (
                                                    <TableCell className="py-2.5 text-center sm:py-3">
                                                        {formatVariation(valores[0], valores[valores.length - 1], metrica.isPercent)}
                                                    </TableCell>
                                                ) : null}
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
});
