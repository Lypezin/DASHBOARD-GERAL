import React from 'react';
import { UtrComparacaoItem } from '@/types';
import { Activity, AlertTriangle } from 'lucide-react';
import { extractUtrValue } from '@/utils/utr/extractUtrValue';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ComparacaoPanelHeader } from './ComparacaoSectionWrapper';

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
                <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-none dark:border-slate-800">
                    <div role="status" aria-busy="true" className="p-4 sm:p-5">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" />
                        <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-900" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-900" />
                        </div>
                        <span className="sr-only">Carregando UTR das semanas selecionadas</span>
                    </div>
                </SaasPanel>
            );
        }

        return (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
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
        <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
            {utrError ? (
                <div role="status" className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20 sm:px-5">
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
            <ComparacaoPanelHeader title="UTR" description="Indicador consolidado das semanas selecionadas." icon={Activity} />
            <div className="subtle-scrollbar overflow-x-auto">
                <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-transparent dark:bg-slate-900/55">
                            <TableHead className="pl-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:pl-5">
                                Métrica
                            </TableHead>
                            {semanasSelecionadas.map((semana) => (
                                <TableHead key={semana} className="border-l border-slate-100 text-center text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    Sem. {semana}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="hover:bg-slate-50/70 dark:hover:bg-slate-900/55">
                            <TableCell className="pl-4 text-sm font-medium text-slate-700 dark:text-slate-300 sm:pl-5">
                                UTR geral
                            </TableCell>
                            {utrComparacao.map((item, idx) => {
                                const utrValue = extractUtrValue(item.utr);
                                const hasError = utrValue === null;

                                return (
                                    <TableCell key={idx} className="border-l border-slate-100 py-3 text-center dark:border-slate-800">
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
        </SaasPanel>
    );
};
