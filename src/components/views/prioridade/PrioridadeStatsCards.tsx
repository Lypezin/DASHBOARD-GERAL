import React from 'react';
import { Users, Megaphone, CheckCircle2, XCircle, Flag, BarChart3 } from 'lucide-react';
import { PrioridadeHeroCard as HeroCard } from './PrioridadeHeroCard';

interface PrioridadeStatsCardsProps {
    totalEntregadores: number;
    totalOfertadas: number;
    totalAceitas: number;
    totalRejeitadas: number;
    totalCompletadas: number;
    aderenciaMedia: number;
}

export const PrioridadeStatsCards = React.memo(function PrioridadeStatsCards({
    totalEntregadores, totalOfertadas, totalAceitas,
    totalRejeitadas, totalCompletadas, aderenciaMedia,
}: PrioridadeStatsCardsProps) {
    return (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-3 xl:grid-cols-6">
            <HeroCard title="Entregadores" icon={Users} value={totalEntregadores.toLocaleString('pt-BR')} subtext="No período" tone="blue" />
            <HeroCard title="Ofertadas" icon={Megaphone} value={totalOfertadas.toLocaleString('pt-BR')} subtext="Total de corridas" tone="sky" />
            <HeroCard title="Aceitas" icon={CheckCircle2} value={totalAceitas.toLocaleString('pt-BR')} subtext="Total de corridas" tone="emerald" />
            <HeroCard title="Rejeitadas" icon={XCircle} value={totalRejeitadas.toLocaleString('pt-BR')} subtext="Total de corridas" tone="rose" />
            <HeroCard title="Completadas" icon={Flag} value={totalCompletadas.toLocaleString('pt-BR')} subtext="Total de corridas" tone="blue" />
            <HeroCard title="Aderência média" icon={BarChart3} value={`${aderenciaMedia.toFixed(1)}%`} subtext="Média do período" tone="emerald" isPercentage />
        </dl>
    );
});
