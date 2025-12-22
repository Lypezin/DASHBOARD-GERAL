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

    // Helper to render a card with premium styling
    const SummaryCard = ({
        title,
        icon: Icon,
        value,
        opsValue,
        mktValue,
        colorClass,
        bgClass,
        iconBgClass
    }: {
        title: string;
        icon: any;
        value: string;
        opsValue: string;
        mktValue: string;
        colorClass: string;
        bgClass: string;
        iconBgClass: string;
    }) => (
        <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon className="w-16 h-16" />
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className={`text-2xl font-bold tracking-tight mb-3 ${colorClass}`}>
                    {value}
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 font-medium">Ops</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{opsValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Mkt</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{mktValue}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard
                title="Horas Totais"
                icon={Clock}
                value={formatDuration(totalHours)}
                opsValue={formatDuration(totals.segundos_ops)}
                mktValue={formatDuration(totals.segundos_mkt)}
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <SummaryCard
                title="Ofertadas"
                icon={Send}
                value={(totals.ofertadas_ops + totals.ofertadas_mkt).toLocaleString('pt-BR')}
                opsValue={totals.ofertadas_ops.toLocaleString('pt-BR')}
                mktValue={totals.ofertadas_mkt.toLocaleString('pt-BR')}
                colorClass="text-slate-600 dark:text-slate-400"
                bgClass="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/20 dark:to-slate-900"
                iconBgClass="bg-slate-100 dark:bg-slate-800"
            />

            <SummaryCard
                title="Aceitas"
                icon={CheckCircle2}
                value={(totals.aceitas_ops + totals.aceitas_mkt).toLocaleString('pt-BR')}
                opsValue={totals.aceitas_ops.toLocaleString('pt-BR')}
                mktValue={totals.aceitas_mkt.toLocaleString('pt-BR')}
                colorClass="text-cyan-600 dark:text-cyan-400"
                bgClass="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-slate-900"
                iconBgClass="bg-cyan-100 dark:bg-cyan-900/40"
            />

            <SummaryCard
                title="Completas"
                icon={CheckCircle2}
                value={(totals.concluidas_ops + totals.concluidas_mkt).toLocaleString('pt-BR')}
                opsValue={totals.concluidas_ops.toLocaleString('pt-BR')}
                mktValue={totals.concluidas_mkt.toLocaleString('pt-BR')}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <SummaryCard
                title="Rejeitadas"
                icon={XCircle}
                value={(totals.rejeitadas_ops + totals.rejeitadas_mkt).toLocaleString('pt-BR')}
                opsValue={totals.rejeitadas_ops.toLocaleString('pt-BR')}
                mktValue={totals.rejeitadas_mkt.toLocaleString('pt-BR')}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900"
                iconBgClass="bg-rose-100 dark:bg-rose-900/40"
            />
        </div>
    );
});
