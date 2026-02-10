import React from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Users, Megaphone, RotateCcw, AlertCircle } from 'lucide-react';
import { useEntradaSaidaTotals } from '../hooks/useEntradaSaidaTotals';
import { MarketingStatsCard } from './MarketingStatsCard';

interface EntradaSaidaStatsCardsProps {
    data: any[];
}

export const EntradaSaidaStatsCards: React.FC<EntradaSaidaStatsCardsProps> = ({ data }) => {
    const { totals, saldo_total, saldo_marketing, saldo_operacional, formatPercent } = useEntradaSaidaTotals(data);

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ENTRADAS */}
            <MarketingStatsCard
                title="Entradas"
                value={totals.entradas_total}
                subtitle="Total no período"
                icon={<ArrowUpRight className="h-5 w-5" />}
                colorTheme="emerald"
                breakdown={[
                    {
                        label: 'Marketing',
                        value: totals.entradas_marketing,
                        percent: formatPercent(totals.entradas_marketing, totals.entradas_total),
                        icon: <Megaphone className="w-3.5 h-3.5" />
                    },
                    {
                        label: 'Operacional',
                        value: totals.entradas_operacional,
                        percent: formatPercent(totals.entradas_operacional, totals.entradas_total),
                        icon: <Users className="w-3.5 h-3.5" />
                    }
                ]}
            />

            {/* RETOMADA */}
            <MarketingStatsCard
                title="Retomada"
                value={totals.retomada_total}
                subtitle="Retornaram à base"
                icon={<RotateCcw className="h-5 w-5" />}
                colorTheme="blue"
                breakdown={[
                    {
                        label: 'Marketing',
                        value: totals.retomada_marketing,
                        percent: formatPercent(totals.retomada_marketing, totals.retomada_total),
                        icon: <Megaphone className="w-3.5 h-3.5" />
                    },
                    {
                        label: 'Operacional',
                        value: totals.retomada_operacional,
                        percent: formatPercent(totals.retomada_operacional, totals.retomada_total),
                        icon: <Users className="w-3.5 h-3.5" />
                    }
                ]}
            />

            {/* SAÍDAS (Inclui Novos) */}
            <MarketingStatsCard
                title="Saídas"
                value={totals.saidas_total}
                subtitle="Total no período"
                icon={<ArrowDownRight className="h-5 w-5" />}
                colorTheme="rose"
                breakdown={[
                    {
                        label: 'Marketing',
                        value: totals.saidas_marketing,
                        percent: formatPercent(totals.saidas_marketing, totals.saidas_total),
                        icon: <Megaphone className="w-3.5 h-3.5" />
                    },
                    {
                        label: 'Operacional',
                        value: totals.saidas_operacional,
                        percent: formatPercent(totals.saidas_operacional, totals.saidas_total),
                        icon: <Users className="w-3.5 h-3.5" />
                    },
                    {
                        label: 'Novos (Desist.)',
                        value: totals.saidas_novos,
                        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    }
                ]}
            />

            {/* SALDO TOTAL */}
            <MarketingStatsCard
                title="Saldo Total"
                value={`${saldo_total > 0 ? '+' : ''}${saldo_total}`}
                subtitle="Crescimento Líquido"
                icon={saldo_total >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                colorTheme={saldo_total >= 0 ? 'indigo' : 'amber'}
                breakdown={[
                    { label: 'Mkt', value: `${saldo_marketing > 0 ? '+' : ''}${saldo_marketing}` },
                    { label: 'Ops', value: `${saldo_operacional > 0 ? '+' : ''}${saldo_operacional}` }
                ]}
            />
        </div>
    );
};
