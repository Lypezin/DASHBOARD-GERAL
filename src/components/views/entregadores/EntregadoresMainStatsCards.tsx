import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle, Truck, Clock } from 'lucide-react';

interface EntregadoresMainStatsCardsProps {
    totalEntregadores: number;
    aderenciaMedia: number;
    rejeicaoMedia: number;
    totalCorridas: number;
    totalHoras: string;
    totalTitle?: string;
    totalSubtext?: string;
    corridasTitle?: string;
    corridasSubtext?: string;
}

type CardConfig = {
    title: string;
    value: string;
    subtext: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    badgeClass: string;
    progressValue?: number;
    progressClass?: string;
    compact?: boolean;
};

export const EntregadoresMainStatsCards = React.memo(function EntregadoresMainStatsCards({
    totalEntregadores,
    aderenciaMedia,
    rejeicaoMedia,
    totalCorridas,
    totalHoras,
    totalTitle = 'Total de Entregadores',
    totalSubtext = 'Entregadores listados',
    corridasTitle = 'Corridas Completas',
    corridasSubtext = 'Total completado',
}: EntregadoresMainStatsCardsProps) {
    const cards: CardConfig[] = [
        {
            title: totalTitle,
            value: totalEntregadores.toLocaleString('pt-BR'),
            subtext: totalSubtext,
            icon: Users,
            iconClass: 'text-blue-500',
            badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        },
        {
            title: 'Aderencia Media',
            value: `${aderenciaMedia.toFixed(1)}%`,
            subtext: 'Media de aderencia do grupo',
            icon: CheckCircle2,
            iconClass: 'text-emerald-500',
            badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            progressValue: aderenciaMedia,
            progressClass: 'bg-emerald-500',
        },
        {
            title: 'Rejeicao Media',
            value: `${rejeicaoMedia.toFixed(1)}%`,
            subtext: 'Media de rejeicao no periodo',
            icon: XCircle,
            iconClass: 'text-rose-500',
            badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            progressValue: rejeicaoMedia,
            progressClass: 'bg-rose-500',
        },
        {
            title: corridasTitle,
            value: totalCorridas.toLocaleString('pt-BR'),
            subtext: corridasSubtext,
            icon: Truck,
            iconClass: 'text-sky-500',
            badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
        },
        {
            title: 'Total Horas',
            value: totalHoras,
            subtext: 'Horas totais do conjunto filtrado',
            icon: Clock,
            iconClass: 'text-orange-500',
            badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
            compact: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card
                        key={card.title}
                        className="border-slate-200/70 bg-white/88 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/84 dark:hover:border-slate-700"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="min-w-0 truncate text-sm font-semibold text-slate-500 dark:text-slate-400" title={card.title}>
                                {card.title}
                            </CardTitle>
                            <span className={`rounded-2xl px-2.5 py-2 ${card.badgeClass}`}>
                                <Icon className={`h-4 w-4 ${card.iconClass}`} />
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`font-mono font-black text-slate-950 dark:text-white ${card.compact ? 'break-words text-lg tracking-tighter sm:text-xl' : 'break-words text-2xl'}`}
                                title={card.value}
                            >
                                {card.value}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400" title={card.subtext}>
                                {card.subtext}
                            </p>
                            {typeof card.progressValue === 'number' ? (
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={`h-full rounded-full ${card.progressClass}`}
                                        style={{ width: `${Math.min(card.progressValue, 100)}%` }}
                                    />
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
});

EntregadoresMainStatsCards.displayName = 'EntregadoresMainStatsCards';
