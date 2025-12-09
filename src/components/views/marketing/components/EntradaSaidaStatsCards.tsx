import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Users, Megaphone } from 'lucide-react';

interface EntradaSaidaStatsCardsProps {
    data: any[];
}

export const EntradaSaidaStatsCards: React.FC<EntradaSaidaStatsCardsProps> = ({ data }) => {
    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            entradas_total: acc.entradas_total + (Number(curr.entradas_total) || 0),
            entradas_marketing: acc.entradas_marketing + (Number(curr.entradas_marketing) || 0),
            entradas_operacional: acc.entradas_operacional + (Number(curr.entradas_operacional) || 0),

            saidas_total: acc.saidas_total + (Number(curr.saidas_total) || 0),
            saidas_marketing: acc.saidas_marketing + (Number(curr.saidas_marketing) || 0),
            saidas_operacional: acc.saidas_operacional + (Number(curr.saidas_operacional) || 0),
        }), {
            entradas_total: 0, entradas_marketing: 0, entradas_operacional: 0,
            saidas_total: 0, saidas_marketing: 0, saidas_operacional: 0
        });
    }, [data]);

    const saldo_total = totals.entradas_total - totals.saidas_total;
    const saldo_marketing = totals.entradas_marketing - totals.saidas_marketing;
    const saldo_operacional = totals.entradas_operacional - totals.saidas_operacional;

    const formatPercent = (part: number, total: number) => {
        if (!total) return '0%';
        return `${Math.round((part / total) * 100)}%`;
    };

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ENTRADAS - Comparison Block */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-1 shadow-lg shadow-emerald-500/20">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full rounded-xl bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="rounded-lg bg-white/20 p-2">
                                <ArrowUpRight className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Entradas</span>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-3xl font-bold text-white">{totals.entradas_total}</h3>
                            <p className="text-xs text-emerald-100">Total no período</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/10">
                        {/* Marketing */}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-white/90">
                                <Megaphone className="w-3.5 h-3.5 mr-2" />
                                <span>Marketing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{totals.entradas_marketing}</span>
                                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">
                                    {formatPercent(totals.entradas_marketing, totals.entradas_total)}
                                </span>
                            </div>
                        </div>

                        {/* Operacional */}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-white/90">
                                <Users className="w-3.5 h-3.5 mr-2" />
                                <span>Operacional</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{totals.entradas_operacional}</span>
                                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">
                                    {formatPercent(totals.entradas_operacional, totals.entradas_total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAÍDAS - Comparison Block */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-1 shadow-lg shadow-rose-500/20">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full rounded-xl bg-gradient-to-br from-rose-500/90 to-rose-600/90 p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="rounded-lg bg-white/20 p-2">
                                <ArrowDownRight className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Saídas</span>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-3xl font-bold text-white">{totals.saidas_total}</h3>
                            <p className="text-xs text-rose-100">Total no período</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/10">
                        {/* Marketing */}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-white/90">
                                <Megaphone className="w-3.5 h-3.5 mr-2" />
                                <span>Marketing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{totals.saidas_marketing}</span>
                                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">
                                    {formatPercent(totals.saidas_marketing, totals.saidas_total)}
                                </span>
                            </div>
                        </div>

                        {/* Operacional */}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-white/90">
                                <Users className="w-3.5 h-3.5 mr-2" />
                                <span>Operacional</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{totals.saidas_operacional}</span>
                                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">
                                    {formatPercent(totals.saidas_operacional, totals.saidas_total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAlDO TOTAL - Card */}
            <div className={`group relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${saldo_total >= 0
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
                }`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                {saldo_total >= 0 ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
                            </div>
                            <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Saldo Total</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {saldo_total > 0 ? '+' : ''}{saldo_total}
                            </h3>
                            <p className="mt-1 text-xs text-white/70">Crescimento Líquido</p>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-white/10 mt-2">
                        <div className="flex justify-between items-center text-xs text-white/80">
                            <span>Mkt:</span>
                            <span className="font-bold">{saldo_marketing > 0 ? '+' : ''}{saldo_marketing}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-white/80">
                            <span>Ops:</span>
                            <span className="font-bold">{saldo_operacional > 0 ? '+' : ''}{saldo_operacional}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SALDO NOVICE (New Metric: Desistências de Novos) */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 p-1 shadow-lg shadow-orange-500/20">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full rounded-xl bg-gradient-to-br from-orange-400/90 to-orange-500/90 p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="rounded-lg bg-white/20 p-2">
                                <ArrowDownRight className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Novos (Desist.)</span>
                        </div>
                        {/* Calculate Novice Totals on the fly or add to useMemo. Using simple reduce here for simplicity if strictly visual. */}
                        {/* Assuming we might want to show total novice churn */}
                        <div className="mb-4">
                            <h3 className="text-3xl font-bold text-white">
                                {data.reduce((acc, curr) => acc + (Number(curr.saidas_novos) || 0), 0)}
                            </h3>
                            <p className="text-xs text-orange-100">Não Maturados (&lt;30)</p>
                        </div>
                    </div>

                    {/* Reuse Mkt/Ops breakdown for Novice if needed, or keep simple. User asked for Entradas/Saidas specifically. */}
                    {/* Let's keep this simple or replace the 4th card with something useful. */}
                    <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-white/70">
                            Entregadores que saíram antes de completar 30 corridas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
