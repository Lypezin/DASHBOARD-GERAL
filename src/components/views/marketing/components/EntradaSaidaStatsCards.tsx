import React from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Users, Megaphone, RotateCcw, AlertCircle, Activity, UserX } from 'lucide-react';
import { useEntradaSaidaTotals } from '../hooks/useEntradaSaidaTotals';
import { MarketingStatsCard } from './MarketingStatsCard';

export const EntradaSaidaStatsCards: React.FC<{ data: any[] }> = ({ data }) => {
    const { totals, saldo_total, saldo_marketing, saldo_operacional, base_ativa, variacao_total, formatPercent } = useEntradaSaidaTotals(data);
    const desistenciaRate = totals.saidas_total > 0 ? Math.round((totals.saidas_novos / totals.saidas_total) * 100) : 0;

    const flowCards = [
        {
            title: "Entradas", value: totals.entradas_total, subtitle: "Total no período", icon: <ArrowUpRight className="h-5 w-5" />, colorTheme: "emerald" as const,
            breakdown: [
                { label: 'Marketing', value: totals.entradas_marketing, percent: formatPercent(totals.entradas_marketing, totals.entradas_total), icon: <Megaphone className="w-3.5 h-3.5" /> },
                { label: 'Operacional', value: totals.entradas_operacional, percent: formatPercent(totals.entradas_operacional, totals.entradas_total), icon: <Users className="w-3.5 h-3.5" /> }
            ]
        },
        {
            title: "Retomada", value: totals.retomada_total, subtitle: "Retornaram à base", icon: <RotateCcw className="h-5 w-5" />, colorTheme: "blue" as const,
            breakdown: [
                { label: 'Marketing', value: totals.retomada_marketing, percent: formatPercent(totals.retomada_marketing, totals.retomada_total), icon: <Megaphone className="w-3.5 h-3.5" /> },
                { label: 'Operacional', value: totals.retomada_operacional, percent: formatPercent(totals.retomada_operacional, totals.retomada_total), icon: <Users className="w-3.5 h-3.5" /> }
            ]
        },
        {
            title: "Saídas", value: totals.saidas_total, subtitle: "Total no período", icon: <ArrowDownRight className="h-5 w-5" />, colorTheme: "rose" as const,
            breakdown: [
                { label: 'Marketing', value: totals.saidas_marketing, percent: formatPercent(totals.saidas_marketing, totals.saidas_total), icon: <Megaphone className="w-3.5 h-3.5" /> },
                { label: 'Operacional', value: totals.saidas_operacional, percent: formatPercent(totals.saidas_operacional, totals.saidas_total), icon: <Users className="w-3.5 h-3.5" /> }
            ]
        }
    ];

    const summaryCards = [
        {
            title: "Saldo Novos", value: `${saldo_total > 0 ? '+' : ''}${saldo_total}`, subtitle: "Entradas − Saídas",
            icon: saldo_total >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />, colorTheme: saldo_total >= 0 ? 'indigo' as const : 'amber' as const,
            breakdown: [
                { label: 'Mkt', value: `${saldo_marketing > 0 ? '+' : ''}${saldo_marketing}` },
                { label: 'Ops', value: `${saldo_operacional > 0 ? '+' : ''}${saldo_operacional}` }
            ]
        },
        {
            title: "Desistências", value: totals.saidas_novos, subtitle: "Saíram antes de 30 corridas", icon: <UserX className="h-5 w-5" />, colorTheme: "amber" as const,
            breakdown: [{ label: '% das Saídas', value: `${desistenciaRate}%`, icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> }]
        },
        {
            title: "Base Ativa", value: base_ativa.toLocaleString('pt-BR'), subtitle: "Última semana", icon: <Activity className="h-5 w-5" />, colorTheme: variacao_total >= 0 ? 'blue' as const : 'amber' as const,
            breakdown: [{ label: 'Variação', value: `${variacao_total > 0 ? '+' : ''}${variacao_total}`, icon: variacao_total >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> }]
        }
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {flowCards.map((c, i) => <MarketingStatsCard key={i} title={c.title} value={c.value} subtitle={c.subtitle} icon={c.icon} colorTheme={c.colorTheme} breakdown={c.breakdown} />)}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((c, i) => <MarketingStatsCard key={i} title={c.title} value={c.value} subtitle={c.subtitle} icon={c.icon} colorTheme={c.colorTheme} breakdown={c.breakdown} />)}
            </div>
        </div>
    );
};
