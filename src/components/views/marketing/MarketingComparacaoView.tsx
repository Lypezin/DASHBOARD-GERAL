'use client';

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { MarketingComparacaoTable } from './MarketingComparacaoTable';
import { useMarketingComparacaoViewController } from './useMarketingComparacaoViewController';

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { data, loading, error, totals, praca } = useMarketingComparacaoViewController(filters);

    return (
        <div className="mx-auto w-full max-w-[1800px] space-y-8 pb-20 animate-fade-in">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                            Atualizando comparativo semanal...
                        </div>
                    ) : null}

                    <MarketingSummaryCards totals={totals} />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-sky-500 to-blue-600 shadow-sm" />
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                                        Comparativo Semanal
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Análise detalhada de volume e conversão (Operacional vs Marketing)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
                            <MarketingComparacaoTable data={data} praca={praca} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

export default MarketingComparacaoView;
