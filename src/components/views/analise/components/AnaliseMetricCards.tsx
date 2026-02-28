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
        accentColor,
        progress
    }: {
        title: string;
        value: string;
        icon: any;
        accentColor: string; // e.g. "orange", "blue", "emerald", "rose", "violet"
        progress?: { value: number }
    }) => (
        <div
            className="relative flex flex-col gap-4 rounded-xl p-5 overflow-hidden group transition-all duration-300"
            style={{
                background: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
        >
            {/* Gradient accent line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-${accentColor}-500/0 via-${accentColor}-500/50 to-${accentColor}-500/0 opacity-50 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start">
                <div className={`p-2 bg-${accentColor}-500/10 rounded-lg text-${accentColor}-400 border border-${accentColor}-500/20`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
                <p className="text-white text-2xl font-bold tracking-tight">{value}</p>

                {progress && (
                    <div className={`w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden`}>
                        <div
                            className={`bg-gradient-to-r from-${accentColor}-600 to-${accentColor}-400 h-1.5 rounded-full transition-all duration-1000`}
                            style={{ width: `${Math.min(progress.value, 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );

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
                progress={{ value: taxaAceitacao }}
            />
            <HeroCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                accentColor="rose"
                progress={{ value: taxaRejeicao }}
            />
            <HeroCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                accentColor="violet"
                progress={{ value: taxaCompletude }}
            />
        </div>
    );
};
