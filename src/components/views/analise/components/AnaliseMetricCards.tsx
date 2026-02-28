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

/* Glass panel card com glow-line gradient no bottom */
const glassStyle: React.CSSProperties = {
    background: 'rgba(22, 31, 48, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
};

const glowLineColors: Record<string, string> = {
    orange: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.5), transparent)',
    blue: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
    emerald: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)',
    rose: 'linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.5), transparent)',
    violet: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)',
};

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
        accentColor: string;
        progress?: { value: number; label: string }
    }) => (
        <div
            className="rounded-xl p-5 relative overflow-hidden group hover:brightness-110 transition-all duration-300"
            style={glassStyle}
        >
            {/* Icon badge */}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-${accentColor}-500/10 rounded-lg text-${accentColor}-400`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {/* Value */}
            <div className={progress ? 'space-y-1 mb-3' : 'space-y-1'}>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>

            {/* Progress bar */}
            {progress && (
                <>
                    <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`bg-gradient-to-r from-${accentColor}-600 to-${accentColor}-400 h-full rounded-full transition-all duration-1000`}
                            style={{ width: `${Math.min(progress.value, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                        <span>{progress.label}</span>
                        <span className={`text-${accentColor}-400`}>{progress.value.toFixed(1)}%</span>
                    </div>
                </>
            )}

            {/* Glow line at bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: glowLineColors[accentColor] || glowLineColors.blue }}
            />
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
