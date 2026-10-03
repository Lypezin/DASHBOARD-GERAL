import React from 'react';
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
    loading?: boolean;
    utrError?: string | null;
    onRetry?: () => void;
}

export const ComparacaoUtrSection: React.FC<ComparacaoUtrSectionProps> = ({
    utrComparacao,
    semanasSelecionadas,
    loading = false,
    utrError,
    onRetry,
}) => {
    if (utrComparacao.length === 0) {
        if (loading && !utrError) {
            return (
                <div
                    role="status"
                    aria-busy="true"
                    className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/70"
                >
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" />
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-900" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-900" />
                    </div>
                    <span className="sr-only">Carregando UTR das semanas selecionadas</span>
                </div>
            );
        }

        return (
            <div className="flex flex-wrap items-center gap-3 rounded-[1.6rem] border border-amber-200/80 bg-amber-50/90 p-4 shadow-[0_18px_40px_-34px_rgba(217,119,6,0.35)] dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="min-w-0 flex-1 text-sm text-amber-700 dark:text-amber-300">
                    {utrError ? `Falha ao carregar a UTR: ${utrError}` : 'UTR não disponível para as semanas selecionadas.'}
                </p>
                {utrError && onRetry ? (
                    <button type="button" onClick={onRetry} className="text-sm font-semibold text-amber-800 underline underline-offset-2 dark:text-amber-200">
                        Tentar novamente
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-950/80">
            {utrError ? (
                <div role="status" className="flex flex-wrap items-center gap-3 border-b border-amber-200/80 bg-amber-50/90 px-6 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    <p className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-200">
                        Falha ao consultar a UTR. Valores N/D podem indicar que a consulta não concluiu. {utrError}
                    </p>
                    {onRetry ? (
                        <button type="button" onClick={onRetry} className="text-sm font-semibold text-amber-800 underline underline-offset-2 dark:text-amber-200">
                            Tentar novamente
                        </button>
                    ) : null}
                </div>
            ) : null}
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
