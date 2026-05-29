import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Clock, BarChart2, Calendar } from 'lucide-react';

interface EvolucaoStatsCardsProps {
    dadosAtivos: any[];
    viewMode: 'mensal' | 'semanal';
    anoSelecionado: number;
}

export const EvolucaoStatsCards = React.memo<EvolucaoStatsCardsProps>(({ dadosAtivos, viewMode, anoSelecionado }) => {
    const { totalCorridas, totalHoras, mediaCorridas } = React.useMemo(() => {
        const tCorridas = dadosAtivos.reduce(
            (sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0),
            0
        );
        const tHoras = dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600;
        const mCorridas = dadosAtivos.length > 0 ? tCorridas / dadosAtivos.length : 0;
        return { totalCorridas: tCorridas, totalHoras: tHoras, mediaCorridas: mCorridas };
    }, [dadosAtivos]);

    if (dadosAtivos.length === 0) {
        return null;
    }

    const HeroCard = ({
        title,
        value,
        subtext,
        icon: Icon,
        colorFrom,
        colorTo,
        iconColor,
    }: {
        title: string;
        value: string | number;
        subtext: string;
        icon: any;
        colorFrom: string;
        colorTo: string;
        iconColor: string;
    }) => (
        <Card className="group relative overflow-hidden border-none shadow-lg">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 transition-opacity duration-500 group-hover:opacity-20`} />

            <div className="absolute -bottom-6 -right-6 rotate-12 transform opacity-5 transition-transform duration-700 group-hover:scale-110">
                <Icon className={`h-36 w-36 ${iconColor}`} />
            </div>

            <CardContent className="relative z-10 p-6">
                <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 ${iconColor}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
                    <div className="font-mono text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        {value}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">{subtext}</p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HeroCard
                title="Total de Corridas"
                icon={Car}
                value={totalCorridas.toLocaleString('pt-BR')}
                subtext={`${dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas`}
                colorFrom="from-blue-400"
                colorTo="to-sky-600"
                iconColor="text-blue-600"
            />

            <HeroCard
                title="Total de Horas"
                icon={Clock}
                value={formatarHorasParaHMS(totalHoras)}
                subtext="Tempo total trabalhado"
                colorFrom="from-amber-400"
                colorTo="to-orange-600"
                iconColor="text-orange-600"
            />

            <HeroCard
                title={`Media ${viewMode === 'mensal' ? 'Mensal' : 'Semanal'}`}
                icon={BarChart2}
                value={mediaCorridas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                subtext="Corridas por periodo"
                colorFrom="from-emerald-400"
                colorTo="to-teal-600"
                iconColor="text-emerald-600"
            />

            <HeroCard
                title="Periodo Analisado"
                icon={Calendar}
                value={anoSelecionado}
                subtext={`${viewMode === 'mensal' ? '12 meses' : '53 semanas'} disponiveis`}
                colorFrom="from-sky-400"
                colorTo="to-cyan-600"
                iconColor="text-sky-600"
            />
        </div>
    );
});

EvolucaoStatsCards.displayName = 'EvolucaoStatsCards';
