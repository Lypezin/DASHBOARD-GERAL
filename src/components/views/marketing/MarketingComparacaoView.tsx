'use client';

import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { DashboardFilters } from '@/types';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { MarketingPeriodSummary } from './MarketingPeriodSummary';
import { MarketingComparacaoTable } from './MarketingComparacaoTable';
import { useMarketingComparacaoViewController } from './useMarketingComparacaoViewController';

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { data, loading, error, refetch, totals, praca } = useMarketingComparacaoViewController(filters);

    return (
        <ViewContainer className="space-y-5 pb-10 pt-4">
            <header className="rounded-xl border border-[#164d70] bg-[#174d70] px-4 py-4 shadow-[0_8px_28px_-22px_rgba(12,54,81,0.6)] sm:px-6 sm:py-5">
                <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[24px]">Operacional | Marketing</h1>
                <p className="mt-1.5 text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">
                    Compare os indicadores semanais da operação e do marketing.
                </p>
            </header>

            {loading && data.length === 0 ? (
                <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-[#d8e4eb] bg-white px-4 py-12 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
                    <Loader2 className="h-5 w-5 animate-spin text-[#38708e] motion-reduce:animate-none dark:text-sky-300" aria-hidden="true" />
                    Carregando dados do comparativo semanal…
                </div>
            ) : error && data.length === 0 ? (
                <Alert variant="destructive" role="alert" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <AlertTitle>Não foi possível carregar os dados</AlertTitle>
                            <AlertDescription className="mt-1">{error}</AlertDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={refetch} disabled={loading} className="shrink-0 gap-2">
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Tentar novamente
                        </Button>
                    </div>
                </Alert>
            ) : !loading && !error && data.length === 0 ? (
                <section role="status" className="rounded-xl border border-[#d8e4eb] bg-white px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-950/80">
                    <h2 className="text-base font-semibold text-[#183f58] dark:text-slate-100">Nenhum dado no período</h2>
                    <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Não há semanas com dados para os filtros selecionados.
                    </p>
                </section>
            ) : (
                <div className="min-w-0 space-y-5">
                    {loading ? (
                        <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            Atualizando comparativo semanal…
                        </div>
                    ) : null}

                    {error ? (
                        <Alert variant="destructive" role="alert" className="rounded-xl">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <AlertTitle>Não foi possível atualizar os dados</AlertTitle>
                                    <AlertDescription className="mt-1">
                                        A tabela mantém a última resposta válida. {error}
                                    </AlertDescription>
                                </div>
                                <Button type="button" variant="outline" onClick={refetch} disabled={loading} className="shrink-0 gap-2">
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    Tentar novamente
                                </Button>
                            </div>
                        </Alert>
                    ) : null}

                    <MarketingPeriodSummary totals={totals} />

                    <section aria-labelledby="marketing-weekly-comparison-title" className="overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-950/80">
                        <header className="flex min-w-0 flex-col gap-1 border-b border-[#e2ebf0] px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                            <div className="min-w-0">
                                <h2 id="marketing-weekly-comparison-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Comparativo semanal</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Volume e conversão por semana, separados por operação e marketing.</p>
                                <p className="mt-1 text-[11px] text-slate-500 xl:hidden dark:text-slate-400">Deslize horizontalmente para ver todas as métricas.</p>
                            </div>
                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{data.length.toLocaleString('pt-BR')} {data.length === 1 ? 'semana' : 'semanas'}</span>
                        </header>
                        <MarketingComparacaoTable data={data} praca={praca} />
                    </section>
                </div>
            )}
        </ViewContainer>
    );
});

export default MarketingComparacaoView;
