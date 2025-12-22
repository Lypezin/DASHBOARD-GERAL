import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface AnaliseMetricCardsProps {
    totals: Totals;
    taxaAceitacao: number;
    taxaCompletude: number;
    taxaRejeicao: number;
    totalHorasEntregues: number;
}

export const AnaliseMetricCards: React.FC<AnaliseMetricCardsProps> = ({
    totals,
    taxaAceitacao,
    taxaCompletude,
    taxaRejeicao,
    totalHorasEntregues
}) => {
    // Reusable Premium Stat Card
    const StatCard = ({
        title,
        icon: Icon,
        value,
        subtext,
        colorClass,
        bgClass,
        iconBgClass,
        progress
    }: {
        title: string;
        icon: any;
        value: string;
        subtext?: string;
        colorClass: string;
        bgClass: string;
        iconBgClass: string;
        progress?: { value: number; color: string };
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
                <div className={`text-2xl font-bold tracking-tight mb-1 ${colorClass} font-mono`}>
                    {value}
                </div>
                {subtext && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {subtext}
                    </p>
                )}
                {progress && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 flex-1 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                            <div className={`h-full ${progress.color} rounded-full`} style={{ width: `${progress.value}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${colorClass}`}>{progress.value.toFixed(1)}%</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Horas Entregues */}
            <StatCard
                title="Horas Entregues"
                icon={({ className }: { className?: string }) => <span className={`font-bold ${className}`}>H</span>}
                value={formatarHorasParaHMS(totalHorasEntregues)}
                subtext="Total de horas realizadas"
                colorClass="text-orange-600 dark:text-orange-400"
                bgClass="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900"
                iconBgClass="bg-orange-100 dark:bg-orange-900/40"
            />

            {/* Ofertadas */}
            <StatCard
                title="Ofertadas"
                icon={Megaphone}
                value={totals.ofertadas.toLocaleString('pt-BR')}
                subtext="Total de corridas ofertadas"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            {/* Aceitas */}
            <StatCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totals.aceitas.toLocaleString('pt-BR')}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
                progress={{ value: taxaAceitacao, color: 'bg-emerald-500' }}
            />

            {/* Rejeitadas */}
            <StatCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900"
                iconBgClass="bg-rose-100 dark:bg-rose-900/40"
                progress={{ value: taxaRejeicao, color: 'bg-rose-500' }}
            />

            {/* Completadas */}
            <StatCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900"
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/40"
                progress={{ value: taxaCompletude, color: 'bg-indigo-500' }}
            />
        </div>
    );
};
