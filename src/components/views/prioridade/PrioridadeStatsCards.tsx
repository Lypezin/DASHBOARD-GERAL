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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <HeroCard title="Entregadores" icon={Users} value={totalEntregadores.toLocaleString('pt-BR')} subtext="Total cadastrados" colorFrom="from-blue-400" colorTo="to-blue-600" iconColor="text-blue-600" />
            <HeroCard title="Ofertadas" icon={Megaphone} value={totalOfertadas.toLocaleString('pt-BR')} subtext="Total ofertadas" colorFrom="from-sky-400" colorTo="to-cyan-600" iconColor="text-sky-600" />
            <HeroCard title="Aceitas" icon={CheckCircle2} value={totalAceitas.toLocaleString('pt-BR')} subtext="Total aceitas" colorFrom="from-emerald-400" colorTo="to-teal-600" iconColor="text-emerald-600" />
            <HeroCard title="Rejeitadas" icon={XCircle} value={totalRejeitadas.toLocaleString('pt-BR')} subtext="Total rejeitadas" colorFrom="from-rose-400" colorTo="to-pink-600" iconColor="text-rose-600" />
            <HeroCard title="Completadas" icon={Flag} value={totalCompletadas.toLocaleString('pt-BR')} subtext="Total completadas" colorFrom="from-indigo-400" colorTo="to-violet-600" iconColor="text-indigo-600" />
            <HeroCard title="Aderência Média" icon={BarChart3} value={`${aderenciaMedia.toFixed(1)}%`} subtext="Média geral" colorFrom="from-violet-400" colorTo="to-purple-600" iconColor="text-violet-600" isPercentage={true} />
        </div>
    );
});
