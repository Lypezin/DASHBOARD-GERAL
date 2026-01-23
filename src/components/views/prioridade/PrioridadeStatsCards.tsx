import React from 'react';
import {
    Users,
    Megaphone,
    CheckCircle2,
    XCircle,
    Flag,
    BarChart3
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface PrioridadeStatsCardsProps {
    totalEntregadores: number;
    totalOfertadas: number;
    totalAceitas: number;
    totalRejeitadas: number;
    totalCompletadas: number;
    aderenciaMedia: number;
}

export const PrioridadeStatsCards = React.memo(function PrioridadeStatsCards({
    totalEntregadores,
    totalOfertadas,
    totalAceitas,
    totalRejeitadas,
    totalCompletadas,
    aderenciaMedia,
}: PrioridadeStatsCardsProps) {

    // Helper Component for Hero Card
    const HeroCard = ({
        title,
        value,
        subtext,
        icon: Icon,
        colorFrom,
        colorTo,
        iconColor,
        isPercentage = false
    }: {
        title: string;
        value: string;
        subtext: string;
        icon: any;
        colorFrom: string;
        colorTo: string;
        iconColor: string;
        isPercentage?: boolean
    }) => (
        <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-[0.08] group-hover:opacity-[0.12] transition-opacity duration-500`} />

            <div className="absolute -right-6 -bottom-6 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Icon className={`w-32 h-32 ${iconColor}`} />
            </div>

            <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
                    <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
                        {value}
                    </div>
                    {isPercentage && (
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-current ${iconColor}`}
                                style={{ width: value }}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <HeroCard
                title="Entregadores"
                icon={Users}
                value={totalEntregadores.toLocaleString('pt-BR')}
                subtext="Total cadastrados"
                colorFrom="from-blue-400"
                colorTo="to-blue-600"
                iconColor="text-blue-600"
            />

            <HeroCard
                title="Ofertadas"
                icon={Megaphone}
                value={totalOfertadas.toLocaleString('pt-BR')}
                subtext="Total ofertadas"
                colorFrom="from-sky-400"
                colorTo="to-cyan-600"
                iconColor="text-sky-600"
            />

            <HeroCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totalAceitas.toLocaleString('pt-BR')}
                subtext="Total aceitas"
                colorFrom="from-emerald-400"
                colorTo="to-teal-600"
                iconColor="text-emerald-600"
            />

            <HeroCard
                title="Rejeitadas"
                icon={XCircle}
                value={totalRejeitadas.toLocaleString('pt-BR')}
                subtext="Total rejeitadas"
                colorFrom="from-rose-400"
                colorTo="to-pink-600"
                iconColor="text-rose-600"
            />

            <HeroCard
                title="Completadas"
                icon={Flag}
                value={totalCompletadas.toLocaleString('pt-BR')}
                subtext="Total completadas"
                colorFrom="from-indigo-400"
                colorTo="to-violet-600"
                iconColor="text-indigo-600"
            />

            <HeroCard
                title="Aderência Média"
                icon={BarChart3}
                value={`${aderenciaMedia.toFixed(1)}%`}
                subtext="Média geral"
                colorFrom="from-violet-400"
                colorTo="to-purple-600"
                iconColor="text-violet-600"
                isPercentage={true}
            />
        </div>
    );
});
