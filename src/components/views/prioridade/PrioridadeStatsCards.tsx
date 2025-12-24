import React from 'react';
import {
    Users,
    Megaphone,
    CheckCircle2,
    XCircle,
    Flag,
    BarChart3
} from 'lucide-react';
import { StatCard } from './components/StatCard';

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
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard
                title="Entregadores"
                icon={Users}
                value={totalEntregadores.toLocaleString('pt-BR')}
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <StatCard
                title="Ofertadas"
                icon={Megaphone}
                value={totalOfertadas.toLocaleString('pt-BR')}
                colorClass="text-sky-600 dark:text-sky-400"
                bgClass="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900"
                iconBgClass="bg-sky-100 dark:bg-sky-900/40"
            />

            <StatCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totalAceitas.toLocaleString('pt-BR')}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <StatCard
                title="Rejeitadas"
                icon={XCircle}
                value={totalRejeitadas.toLocaleString('pt-BR')}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900"
                iconBgClass="bg-rose-100 dark:bg-rose-900/40"
            />

            <StatCard
                title="Completadas"
                icon={Flag}
                value={totalCompletadas.toLocaleString('pt-BR')}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900"
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/40"
            />

            <StatCard
                title="Aderência"
                icon={BarChart3}
                value={`${aderenciaMedia.toFixed(1)}%`}
                colorClass="text-violet-600 dark:text-violet-400"
                bgClass="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-slate-900"
                iconBgClass="bg-violet-100 dark:bg-violet-900/40"
            />
        </div>
    );
});
