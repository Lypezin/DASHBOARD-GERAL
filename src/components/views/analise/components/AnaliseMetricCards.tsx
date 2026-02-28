import React from 'react';
import { Megaphone, CheckCircle2, XCircle, Flag, Clock } from 'lucide-react';
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

    const HeroCard = ({
        title,
        value,
        icon: Icon,
        iconBgColor,
        iconTextColor,
        progress
    }: {
        title: string;
        value: string;
        icon: any;
        iconBgColor: string;
        iconTextColor: string;
        progress?: { value: number; color: string; textColor: string }
    }) => (
        <div className="bg-white dark:bg-[#1a2332]/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden">
            {/* Ghost Icon */}
            <div className="absolute right-0 top-0 p-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
                <Icon className={`w-16 h-16 ${iconTextColor}`} />
            </div>

            <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${iconBgColor}`}>
                        <Icon className={`w-[18px] h-[18px] ${iconTextColor}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>

                {progress && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${progress.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${Math.min(progress.value, 100)}%` }}
                            />
                        </div>
                        <span className={`text-xs font-semibold ${progress.textColor}`}>
                            {progress.value.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <HeroCard
                title="Horas Entregues"
                icon={Clock}
                value={formatarHorasParaHMS(totalHorasEntregues)}
                iconBgColor="bg-orange-500/20"
                iconTextColor="text-orange-500"
            />
            <HeroCard
                title="Ofertadas"
                icon={Megaphone}
                value={totals.ofertadas.toLocaleString('pt-BR')}
                iconBgColor="bg-blue-500/20"
                iconTextColor="text-blue-500"
            />
            <HeroCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totals.aceitas.toLocaleString('pt-BR')}
                iconBgColor="bg-emerald-500/20"
                iconTextColor="text-emerald-500"
                progress={{ value: taxaAceitacao, color: 'bg-emerald-500', textColor: 'text-emerald-500' }}
            />
            <HeroCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                iconBgColor="bg-rose-500/20"
                iconTextColor="text-rose-500"
                progress={{ value: taxaRejeicao, color: 'bg-rose-500', textColor: 'text-rose-500' }}
            />
            <HeroCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                iconBgColor="bg-purple-500/20"
                iconTextColor="text-purple-500"
                progress={{ value: taxaCompletude, color: 'bg-purple-500', textColor: 'text-purple-500' }}
            />
        </div>
    );
};
