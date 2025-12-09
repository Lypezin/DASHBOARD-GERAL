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
            saidas_total: acc.saidas_total + (Number(curr.saidas_total) || 0),
            saidas_marketing: acc.saidas_marketing + (Number(curr.saidas_marketing) || 0),
        }), { entradas_total: 0, entradas_marketing: 0, saidas_total: 0, saidas_marketing: 0 });
    }, [data]);

    const saldo_total = totals.entradas_total - totals.saidas_total;
    const saldo_marketing = totals.entradas_marketing - totals.saidas_marketing;

    const formatPercent = (part: number, total: number) => {
        if (!total) return '0%';
        return `${Math.round((part / total) * 100)}%`;
    };

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ENTRADAS - Comparison Block */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-1 shadow-lg shadow-emerald-500/20">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full rounded-xl bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-lg bg-white/20 p-2">
                            <ArrowUpRight className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Entradas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-emerald-100 mb-1 flex items-center"><Users className="w-3 h-3 mr-1" /> Total</p>
                            <h3 className="text-2xl font-bold text-white">{totals.entradas_total}</h3>
                        </div>
                        <div className="text-right border-l border-white/20 pl-4">
                            <p className="text-xs text-emerald-100 mb-1 flex items-center justify-end">Mkt <Megaphone className="w-3 h-3 ml-1" /></p>
                            <h3 className="text-2xl font-bold text-emerald-100">{totals.entradas_marketing}</h3>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs text-emerald-50">
                            <span>Share Marketing</span>
                            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                {formatPercent(totals.entradas_marketing, totals.entradas_total)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAÍDAS - Comparison Block */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-1 shadow-lg shadow-rose-500/20">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative h-full rounded-xl bg-gradient-to-br from-rose-500/90 to-rose-600/90 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-lg bg-white/20 p-2">
                            <ArrowDownRight className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Saídas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-rose-100 mb-1 flex items-center"><Users className="w-3 h-3 mr-1" /> Total</p>
                            <h3 className="text-2xl font-bold text-white">{totals.saidas_total}</h3>
                        </div>
                        <div className="text-right border-l border-white/20 pl-4">
                            <p className="text-xs text-rose-100 mb-1 flex items-center justify-end">Mkt <Megaphone className="w-3 h-3 ml-1" /></p>
                            <h3 className="text-2xl font-bold text-rose-100">{totals.saidas_marketing}</h3>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs text-rose-50">
                            <span>Share Marketing</span>
                            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                {formatPercent(totals.saidas_marketing, totals.saidas_total)}
                            </span>
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
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                            {saldo_total >= 0 ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
                        </div>
                        <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Saldo Total</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-bold text-white tracking-tight">
                            {saldo_total > 0 ? '+' : ''}{saldo_total}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">Crescimento Líquido Geral</p>
                    </div>
                </div>
            </div>

            {/* SALDO MARKETING - Card */}
            <div className={`group relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${saldo_marketing >= 0
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20'
                : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'
                }`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                            {saldo_marketing >= 0 ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
                        </div>
                        <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Saldo Mkt</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-bold text-white tracking-tight">
                            {saldo_marketing > 0 ? '+' : ''}{saldo_marketing}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">Crescimento Líquido Marketing</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
