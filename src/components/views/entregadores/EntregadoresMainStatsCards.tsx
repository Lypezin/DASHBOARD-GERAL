import React from 'react';
import { Users, CheckCircle2, XCircle, Truck, Clock } from 'lucide-react';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';

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

export const EntregadoresMainStatsCards = React.memo(function EntregadoresMainStatsCards({
    totalEntregadores,
    aderenciaMedia,
    rejeicaoMedia,
    totalCorridas,
    totalHoras,
    totalTitle = 'Total de entregadores',
    totalSubtext = 'Entregadores listados',
    corridasTitle = 'Corridas completas',
    corridasSubtext = 'Total completado',
}: EntregadoresMainStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SaasMetric
                icon={Users}
                label={totalTitle}
                value={totalEntregadores.toLocaleString('pt-BR')}
                meta={totalSubtext}
                tone="blue"
                size="lg"
                className="p-5"
            />
            <SaasMetric
                icon={CheckCircle2}
                label="Aderência média"
                value={`${aderenciaMedia.toFixed(1)}%`}
                meta="Média de aderência do grupo"
                tone="emerald"
                size="lg"
                className="p-5"
            />
            <SaasMetric
                icon={XCircle}
                label="Rejeição média"
                value={`${rejeicaoMedia.toFixed(1)}%`}
                meta="Média de rejeição no período"
                tone="rose"
                size="lg"
                className="p-5"
            />
            <SaasMetric
                icon={Truck}
                label={corridasTitle}
                value={totalCorridas.toLocaleString('pt-BR')}
                meta={corridasSubtext}
                tone="blue"
                size="lg"
                className="p-5"
            />
            <SaasMetric
                icon={Clock}
                label="Total de horas"
                value={totalHoras}
                meta="Horas totais do conjunto filtrado"
                tone="amber"
                size="lg"
                className="p-5"
                truncate
            />
        </div>
    );
});

EntregadoresMainStatsCards.displayName = 'EntregadoresMainStatsCards';
