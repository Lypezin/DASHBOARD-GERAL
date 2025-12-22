import React, { useMemo } from 'react';
import { useMarketingComparacao } from './useMarketingComparacao';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { MarketingComparacaoTable } from './MarketingComparacaoTable';

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { user } = useAuth();

    // Determine the date range
    let dataInicial = filters.dataInicial;
    let dataFinal = filters.dataFinal;

    // Force calculation from week/year if they are present, to ensure full ISO week range
    // (This prevents issue where Month/Year filters might clip the start of the week, e.g. Dec 30/31 being excluded from Week 1)
    if (filters.ano && filters.semana) {
        const range = getDateRangeFromWeek(filters.ano, filters.semana);
        dataInicial = range.start;
        dataFinal = range.end;
    } else if (!dataInicial || !dataFinal) {
        // Fallback logic for when dates are missing and no specific week is selected
        if (filters.ano) {
            // Whole year if only year is selected (or default to current year jan 1 - dec 31)
            dataInicial = `${filters.ano}-01-01`;
            dataFinal = `${filters.ano}-12-31`;
        } else {
            // Fallback to current year
            const year = new Date().getFullYear();
            dataInicial = `${year}-01-01`;
            dataFinal = new Date().toISOString().split('T')[0];
        }
    }

    // Handle "Todas" or null praca
    const praca = (filters.praca && filters.praca !== 'Todas') ? filters.praca : null;

    console.log('MarketingComparacaoView Filter Debug:', {
        rawFilters: filters,
        calculated: {
            dataInicial,
            dataFinal,
            praca
        }
    });

    const { data, loading, error } = useMarketingComparacao(
        dataInicial,
        dataFinal,
        user?.organization_id || undefined,
        praca
    );

    // Calculate totals
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            segundos_ops: acc.segundos_ops + row.segundos_ops,
            segundos_mkt: acc.segundos_mkt + row.segundos_mkt,
            ofertadas_ops: acc.ofertadas_ops + row.ofertadas_ops,
            ofertadas_mkt: acc.ofertadas_mkt + row.ofertadas_mkt,
            aceitas_ops: acc.aceitas_ops + row.aceitas_ops,
            aceitas_mkt: acc.aceitas_mkt + row.aceitas_mkt,
            concluidas_ops: acc.concluidas_ops + row.concluidas_ops,
            concluidas_mkt: acc.concluidas_mkt + row.concluidas_mkt,
            rejeitadas_ops: acc.rejeitadas_ops + row.rejeitadas_ops,
            rejeitadas_mkt: acc.rejeitadas_mkt + row.rejeitadas_mkt,
        }), {
            segundos_ops: 0, segundos_mkt: 0,
            ofertadas_ops: 0, ofertadas_mkt: 0,
            aceitas_ops: 0, aceitas_mkt: 0,
            concluidas_ops: 0, concluidas_mkt: 0,
            rejeitadas_ops: 0, rejeitadas_mkt: 0
        });
    }, [data]);

    return (
        <div className="space-y-6 pb-20">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <MarketingSummaryCards totals={totals} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Comparativo: Operacional vs Marketing</CardTitle>
                            <CardDescription>
                                Análise de volume e funil de corridas por semana
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MarketingComparacaoTable data={data} praca={praca} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
});

export default MarketingComparacaoView;
