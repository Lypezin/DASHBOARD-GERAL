
import React from 'react';
import { Megaphone, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AnaliseStatCard } from './AnaliseStatCard';

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
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Horas Entregues */}
            <AnaliseStatCard
                title="Horas Entregues"
                icon={({ className }: { className?: string }) => <span className={`font-bold ${className}`}>H</span>}
                value={formatarHorasParaHMS(totalHorasEntregues)}
                subtext="Total de horas realizadas"
                colorClass="text-orange-600 dark:text-orange-400"
                bgClass="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900"
                iconBgClass="bg-orange-100 dark:bg-orange-900/40"
            />

            {/* Ofertadas */}
            <AnaliseStatCard
                title="Ofertadas"
                icon={Megaphone}
                value={totals.ofertadas.toLocaleString('pt-BR')}
                subtext="Total de corridas ofertadas"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            {/* Aceitas */}
            <AnaliseStatCard
                title="Aceitas"
                icon={CheckCircle2}
                value={totals.aceitas.toLocaleString('pt-BR')}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
                progress={{ value: taxaAceitacao, color: 'bg-emerald-500' }}
            />

            {/* Rejeitadas */}
            <AnaliseStatCard
                title="Rejeitadas"
                icon={XCircle}
                value={totals.rejeitadas.toLocaleString('pt-BR')}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900"
                iconBgClass="bg-rose-100 dark:bg-rose-900/40"
                progress={{ value: taxaRejeicao, color: 'bg-rose-500' }}
            />

            {/* Completadas */}
            <AnaliseStatCard
                title="Completadas"
                icon={Flag}
                value={totals.completadas.toLocaleString('pt-BR')}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900"
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/40"
                progress={{ value: taxaCompletude, color: 'bg-indigo-500' }}
            />
        </div>
    );
};
