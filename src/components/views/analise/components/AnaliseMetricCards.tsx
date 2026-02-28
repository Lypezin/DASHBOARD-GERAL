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

/* Cores hardcoded para o Tailwind safelist (classes dinâmicas) */
const colorMap = {
    orange: {
        iconBg: 'bg-orange-500/10 dark:bg-orange-500/10',
        iconText: 'text-orange-500 dark:text-orange-400',
        barFrom: 'from-orange-500',
        barTo: 'to-orange-400',
        glowBorder: 'group-hover:shadow-orange-500/20',
        rateText: 'text-orange-500 dark:text-orange-400',
        borderAccent: 'border-orange-500/20',
    },
    blue: {
        iconBg: 'bg-blue-500/10 dark:bg-blue-500/10',
        iconText: 'text-blue-500 dark:text-blue-400',
        barFrom: 'from-blue-500',
        barTo: 'to-blue-400',
        glowBorder: 'group-hover:shadow-blue-500/20',
        rateText: 'text-blue-500 dark:text-blue-400',
        borderAccent: 'border-blue-500/20',
    },
    emerald: {
        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        barFrom: 'from-emerald-500',
        barTo: 'to-emerald-400',
        glowBorder: 'group-hover:shadow-emerald-500/20',
        rateText: 'text-emerald-600 dark:text-emerald-400',
        borderAccent: 'border-emerald-500/20',
    },
    rose: {
        iconBg: 'bg-rose-500/10 dark:bg-rose-500/10',
        iconText: 'text-rose-500 dark:text-rose-400',
        barFrom: 'from-rose-500',
        barTo: 'to-rose-400',
        glowBorder: 'group-hover:shadow-rose-500/20',
        rateText: 'text-rose-500 dark:text-rose-400',
        borderAccent: 'border-rose-500/20',
    },
    violet: {
        iconBg: 'bg-violet-500/10 dark:bg-violet-500/10',
        iconText: 'text-violet-500 dark:text-violet-400',
        barFrom: 'from-violet-500',
        barTo: 'to-violet-400',
        glowBorder: 'group-hover:shadow-violet-500/20',
        rateText: 'text-violet-500 dark:text-violet-400',
        borderAccent: 'border-violet-500/20',
    },
};

type AccentColor = keyof typeof colorMap;

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
        accentColor,
        progress,
    }: {
        title: string;
        value: string;
        icon: any;
        accentColor: AccentColor;
        progress?: { value: number; label: string }
    }) => {
        const c = colorMap[accentColor];
        return (
            <div className={`
                group relative rounded-xl p-5 overflow-hidden transition-all duration-300
                bg-white dark:bg-slate-800/50
                border border-slate-200 dark:border-slate-700/50
                hover:border-slate-300 dark:hover:border-slate-600
                hover:shadow-lg dark:hover:shadow-2xl ${c.glowBorder}
            `}>
                {/* Icon badge */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                        <Icon className={`w-5 h-5 ${c.iconText}`} />
                    </div>
                </div>

                {/* Title + Value */}
                <div className={progress ? 'space-y-1 mb-4' : 'space-y-1'}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
                </div>

                {/* Progress bar + Rate */}
                {progress && (
                    <div className="space-y-2">
                        <div className="w-full bg-slate-200 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`bg-gradient-to-r ${c.barFrom} ${c.barTo} h-full rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.min(progress.value, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-slate-400 dark:text-slate-500">{progress.label}</span>
                            <span className={c.rateText}>{progress.value.toFixed(1)}%</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <HeroCard
                title="Horas Entregues"
                icon={Clock}
                value={formatarHorasParaHMS(totalHorasEntregues)}
                accentColor="orange"
            />
            <HeroCard
                title="Ofertadas"
                icon={Megaphone}
                value={totals.ofertadas.toLocaleString('pt-BR')}
                accentColor="blue"
            />
            <HeroCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totals.aceitas.toLocaleString('pt-BR')}
                accentColor="emerald"
                progress={{ value: taxaAceitacao, label: 'TAXA DE ACEITAÇÃO' }}
            />
            <HeroCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                accentColor="rose"
                progress={{ value: taxaRejeicao, label: 'TAXA DE REJEIÇÃO' }}
            />
            <HeroCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                accentColor="violet"
                progress={{ value: taxaCompletude, label: 'TAXA DE COMPLETUDE' }}
            />
        </div>
    );
};
