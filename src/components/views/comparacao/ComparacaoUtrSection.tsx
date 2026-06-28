import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData, UtrComparacaoItem } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { extractUtrValue } from '@/utils/utr/extractUtrValue';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ComparacaoUtrSectionProps {
    utrComparacao: UtrComparacaoItem[];
    semanasSelecionadas: string[];
}

export const ComparacaoUtrSection: React.FC<ComparacaoUtrSectionProps> = ({
    utrComparacao,
    semanasSelecionadas,
}) => {
    if (utrComparacao.length === 0) {
        return (
            <div className="flex items-center gap-3 rounded-[1.6rem] border border-amber-200/80 bg-amber-50/90 p-4 shadow-[0_18px_40px_-34px_rgba(217,119,6,0.35)] dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-300">UTR não disponível para as semanas selecionadas.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-950/80">
            <div className="border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
                <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">UTR</h3>
            </div>
            <div className="subtle-scrollbar overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-transparent dark:bg-slate-900/55">
                            <TableHead className="pl-6 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                Métrica
                            </TableHead>
                            {semanasSelecionadas.map((semana) => (
                                <TableHead key={semana} className="border-l border-slate-100 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                    Sem. {semana}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="hover:bg-slate-50/70 dark:hover:bg-slate-900/55">
                            <TableCell className="pl-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                                UTR geral
                            </TableCell>
                            {utrComparacao.map((item, idx) => {
                                const utrValue = extractUtrValue(item.utr);
                                const hasError = utrValue === null;

                                safeLog.info(`[Comparacao] UTR Semana ${item.semana}:`, { utr: utrValue, hasError });

                                return (
                                    <TableCell key={idx} className="border-l border-slate-100 text-center dark:border-slate-800">
                                        {hasError ? (
                                            <span className="text-sm text-slate-400">N/D</span>
                                        ) : (
                                            <span className={`text-sm font-semibold tabular-nums ${utrValue >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                                                utrValue >= 60 ? 'text-amber-600 dark:text-amber-400' :
                                                    'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                {utrValue.toFixed(2)}%
                                            </span>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
