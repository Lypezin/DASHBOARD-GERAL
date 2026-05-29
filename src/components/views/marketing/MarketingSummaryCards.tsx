
import React from 'react';
import { Clock, Send, CheckCircle2, XCircle, DollarSign, Users } from 'lucide-react';
import { formatDuration } from '@/utils/timeHelpers';
import { calculatePercentage } from '@/utils/formatHelpers';
import { MarketingSummaryCard } from './components/MarketingSummaryCard';

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
    valor_ops: number;
    valor_mkt: number;
    entregadores_ops: number;
    entregadores_mkt: number;
}

interface MarketingSummaryCardsProps {
    totals: MarketingTotals;
}

export const MarketingSummaryCards = React.memo(function MarketingSummaryCards({ totals }: MarketingSummaryCardsProps) {
    const totalHours = totals.segundos_ops + totals.segundos_mkt;
    const totalOfertadas = totals.ofertadas_ops + totals.ofertadas_mkt;
    const totalAceitas = totals.aceitas_ops + totals.aceitas_mkt;
    const totalConcluidas = totals.concluidas_ops + totals.concluidas_mkt;
    const totalRejeitadas = totals.rejeitadas_ops + totals.rejeitadas_mkt;
    const totalValor = (totals.valor_ops || 0) + (totals.valor_mkt || 0);

    // Formatador de moeda
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const cardsConfig = [
        { title: "Horas Totais", icon: Clock, value: formatDuration(totalHours), opsValue: formatDuration(totals.segundos_ops), mktValue: formatDuration(totals.segundos_mkt), opsPercent: calculatePercentage(totals.segundos_ops, totalHours), mktPercent: calculatePercentage(totals.segundos_mkt, totalHours), colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900", iconBgClass: "bg-blue-100 dark:bg-blue-900/40" },
        { title: "Ofertadas", icon: Send, value: totalOfertadas.toLocaleString('pt-BR'), opsValue: totals.ofertadas_ops.toLocaleString('pt-BR'), mktValue: totals.ofertadas_mkt.toLocaleString('pt-BR'), opsPercent: calculatePercentage(totals.ofertadas_ops, totalOfertadas), mktPercent: calculatePercentage(totals.ofertadas_mkt, totalOfertadas), colorClass: "text-slate-600 dark:text-slate-400", bgClass: "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/20 dark:to-slate-900", iconBgClass: "bg-slate-100 dark:bg-slate-800" },
        { title: "Aceitas", icon: CheckCircle2, value: totalAceitas.toLocaleString('pt-BR'), opsValue: totals.aceitas_ops.toLocaleString('pt-BR'), mktValue: totals.aceitas_mkt.toLocaleString('pt-BR'), opsPercent: calculatePercentage(totals.aceitas_ops, totalAceitas), mktPercent: calculatePercentage(totals.aceitas_mkt, totalAceitas), colorClass: "text-cyan-600 dark:text-cyan-400", bgClass: "bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-slate-900", iconBgClass: "bg-cyan-100 dark:bg-cyan-900/40" },
        { title: "Completas", icon: CheckCircle2, value: totalConcluidas.toLocaleString('pt-BR'), opsValue: totals.concluidas_ops.toLocaleString('pt-BR'), mktValue: totals.concluidas_mkt.toLocaleString('pt-BR'), opsPercent: calculatePercentage(totals.concluidas_ops, totalConcluidas), mktPercent: calculatePercentage(totals.concluidas_mkt, totalConcluidas), colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900", iconBgClass: "bg-emerald-100 dark:bg-emerald-900/40" },
        { title: "Rejeitadas", icon: XCircle, value: totalRejeitadas.toLocaleString('pt-BR'), opsValue: totals.rejeitadas_ops.toLocaleString('pt-BR'), mktValue: totals.rejeitadas_mkt.toLocaleString('pt-BR'), opsPercent: calculatePercentage(totals.rejeitadas_ops, totalRejeitadas), mktPercent: calculatePercentage(totals.rejeitadas_mkt, totalRejeitadas), colorClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900", iconBgClass: "bg-rose-100 dark:bg-rose-900/40" },
        { title: "Entregadores", icon: Users, value: (totals.entregadores_ops + totals.entregadores_mkt).toLocaleString('pt-BR'), opsValue: totals.entregadores_ops.toLocaleString('pt-BR'), mktValue: totals.entregadores_mkt.toLocaleString('pt-BR'), opsPercent: calculatePercentage(totals.entregadores_ops, totals.entregadores_ops + totals.entregadores_mkt), mktPercent: calculatePercentage(totals.entregadores_mkt, totals.entregadores_ops + totals.entregadores_mkt), colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900", iconBgClass: "bg-indigo-100 dark:bg-indigo-900/40" },
        { title: "Valor Total", icon: DollarSign, value: formatCurrency(totalValor), opsValue: formatCurrency(totals.valor_ops || 0), mktValue: formatCurrency(totals.valor_mkt || 0), opsPercent: calculatePercentage(totals.valor_ops || 0, totalValor), mktPercent: calculatePercentage(totals.valor_mkt || 0, totalValor), colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900", iconBgClass: "bg-amber-100 dark:bg-amber-900/40" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsConfig.map((card, idx) => (
                <MarketingSummaryCard key={idx} {...card} />
            ))}
        </div>
    );
});
