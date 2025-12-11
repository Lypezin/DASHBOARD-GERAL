import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Send, CheckCircle2, XCircle } from 'lucide-react';
import { formatDuration } from '@/utils/timeHelpers';

interface MarketingTotals {
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    concluidas_ops: number;
    concluidas_mkt: number;
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
}

interface MarketingSummaryCardsProps {
    totals: MarketingTotals;
}

export const MarketingSummaryCards = React.memo(function MarketingSummaryCards({ totals }: MarketingSummaryCardsProps) {
    const totalHours = totals.segundos_ops + totals.segundos_mkt;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Horas Totais
                    </CardTitle>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(totalHours)}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                        <span className="flex items-center gap-1">Ops: <span className="font-mono font-medium">{formatDuration(totals.segundos_ops)}</span></span>
                        <span className="text-purple-600 font-bold flex items-center gap-1">Mkt: <span className="font-mono">{formatDuration(totals.segundos_mkt)}</span></span>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-slate-400">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ofertadas
                    </CardTitle>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Send className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totals.ofertadas_ops + totals.ofertadas_mkt).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                        <span>Ops: {totals.ofertadas_ops.toLocaleString('pt-BR')}</span>
                        <span className="text-purple-600 font-bold">Mkt: {totals.ofertadas_mkt.toLocaleString('pt-BR')}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-cyan-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Aceitas
                    </CardTitle>
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totals.aceitas_ops + totals.aceitas_mkt).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                        <span>Ops: {totals.aceitas_ops.toLocaleString('pt-BR')}</span>
                        <span className="text-purple-600 font-bold">Mkt: {totals.aceitas_mkt.toLocaleString('pt-BR')}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completas
                    </CardTitle>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totals.concluidas_ops + totals.concluidas_mkt).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                        <span>Ops: {totals.concluidas_ops.toLocaleString('pt-BR')}</span>
                        <span className="text-purple-600 font-bold">Mkt: {totals.concluidas_mkt.toLocaleString('pt-BR')}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Rejeitadas
                    </CardTitle>
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totals.rejeitadas_ops + totals.rejeitadas_mkt).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                        <span>Ops: {totals.rejeitadas_ops.toLocaleString('pt-BR')}</span>
                        <span className="text-purple-600 font-bold">Mkt: {totals.rejeitadas_mkt.toLocaleString('pt-BR')}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
