import React from 'react';
import { Megaphone, CheckCircle2, XCircle, Flag, Clock } from 'lucide-react';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';

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

    // Hero Card Component
    const HeroCard = ({
        title,
        value,
        subtext,
        icon: Icon,
        colorFrom,
        colorTo,
        iconColor,
        progress
    }: {
        title: string;
        value: string;
        subtext: string;
        icon: any;
        colorFrom: string;
        colorTo: string;
        iconColor: string;
        progress?: { value: number, color: string }
    }) => (
        <Card className="relative overflow-hidden border-none shadow-lg group">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

            <div className="absolute -right-6 -bottom-6 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Icon className={`w-36 h-36 ${iconColor}`} />
            </div>

            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${iconColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
                    <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
                        {value}
                    </div>

                    {progress ? (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>{subtext}</span>
                                <span className={iconColor}>{progress.value.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${progress.color} transition-all duration-1000`}
                                    style={{ width: `${Math.min(progress.value, 100)}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Horas Entregues */}
            <HeroCard
                title="Horas Entregues"
                icon={Clock}
                value={formatarHorasParaHMS(totalHorasEntregues)}
                subtext="Total de horas realizadas"
                colorFrom="from-amber-400"
                colorTo="to-orange-600"
                iconColor="text-orange-600"
            />

            {/* Ofertadas */}
            <HeroCard
                title="Ofertadas"
                icon={Megaphone}
                value={totals.ofertadas.toLocaleString('pt-BR')}
                subtext="Corridas ofertadas"
                colorFrom="from-blue-400"
                colorTo="to-indigo-600"
                iconColor="text-blue-600"
            />

            {/* Aceitas */}
            <HeroCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totals.aceitas.toLocaleString('pt-BR')}
                subtext="Taxa de Aceitação"
                colorFrom="from-emerald-400"
                colorTo="to-teal-600"
                iconColor="text-emerald-600"
                progress={{ value: taxaAceitacao, color: 'bg-emerald-500' }}
            />

            {/* Rejeitadas */}
            <HeroCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                subtext="Taxa de Rejeição"
                colorFrom="from-rose-400"
                colorTo="to-red-600"
                iconColor="text-rose-600"
                progress={{ value: taxaRejeicao, color: 'bg-rose-500' }}
            />

            {/* Completadas */}
            <HeroCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                subtext="Taxa de Completude"
                colorFrom="from-violet-400"
                colorTo="to-purple-600"
                iconColor="text-purple-600"
                progress={{ value: taxaCompletude, color: 'bg-purple-500' }}
            />
        </div>
    );
};
