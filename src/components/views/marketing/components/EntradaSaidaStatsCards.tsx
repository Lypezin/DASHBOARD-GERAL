import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface EntradaSaidaStatsCardsProps {
    data: any[];
}

export const EntradaSaidaStatsCards: React.FC<EntradaSaidaStatsCardsProps> = ({ data }) => {
    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            entradas: acc.entradas + Number(curr.entradas),
            saidas: acc.saidas + Number(curr.saidas)
        }), { entradas: 0, saidas: 0 });
    }, [data]);

    const saldo = totals.entradas - totals.saidas;
    const taxaCrescimento = totals.saidas > 0 ? ((totals.entradas / totals.saidas - 1) * 100).toFixed(1) : (totals.entradas > 0 ? 100 : 0);

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card Entradas */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                            <ArrowUpRight className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Entradas</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{totals.entradas}</h3>
                        <p className="mt-1 text-sm text-emerald-100/80">Novos entregadores ativos</p>
                    </div>
                </div>
            </div>

            {/* Card Saídas */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                            <ArrowDownRight className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">Saídas</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{totals.saidas}</h3>
                        <p className="mt-1 text-sm text-rose-100/80">Entregadores inativos</p>
                    </div>
                </div>
            </div>

            {/* Card Saldo */}
            <div className={`group relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${saldo >= 0
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/30'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20 hover:shadow-amber-500/30'
                }`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                            {saldo >= 0 ? (
                                <TrendingUp className="h-5 w-5 text-white" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-white" />
                            )}
                        </div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${saldo >= 0 ? 'text-indigo-100' : 'text-amber-100'
                            }`}>Saldo</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {saldo > 0 ? '+' : ''}{saldo}
                        </h3>
                        <p className={`mt-1 text-sm ${saldo >= 0 ? 'text-indigo-100/80' : 'text-amber-100/80'}`}>
                            Crescimento líquido
                        </p>
                    </div>
                </div>
            </div>

            {/* Card Taxa */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-5 shadow-lg shadow-slate-800/20 transition-all duration-300 hover:shadow-xl hover:shadow-slate-800/30 hover:-translate-y-0.5 dark:from-slate-800 dark:to-slate-900">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5 blur-2xl"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Taxa</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {Number(taxaCrescimento) > 0 ? '+' : ''}{taxaCrescimento}%
                        </h3>
                        <p className="mt-1 text-sm text-slate-300/80">Entradas vs Saídas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
