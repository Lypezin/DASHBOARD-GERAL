import type { ElementType } from 'react';
import { CheckCircle2, Clock, Truck, Users, XCircle } from 'lucide-react';

export type EntregadoresMetricTone = 'blue' | 'emerald' | 'rose' | 'amber';

export interface EntregadoresMetricItem {
    icon: ElementType;
    label: string;
    value: string;
    meta: string;
    tone: EntregadoresMetricTone;
}

export function createEntregadoresMetrics({
    totalEntregadores,
    aderenciaMedia,
    rejeicaoMedia,
    totalCorridas,
    totalHoras,
    totalTitle = 'Total de entregadores',
    totalSubtext = 'Entregadores listados',
    corridasTitle = 'Corridas completas',
    corridasSubtext = 'Total completado',
}: {
    totalEntregadores: number;
    aderenciaMedia: number;
    rejeicaoMedia: number;
    totalCorridas: number;
    totalHoras: string;
    totalTitle?: string;
    totalSubtext?: string;
    corridasTitle?: string;
    corridasSubtext?: string;
}): EntregadoresMetricItem[] {
    return [
        {
            icon: Users,
            label: totalTitle,
            value: totalEntregadores.toLocaleString('pt-BR'),
            meta: totalSubtext,
            tone: 'blue',
        },
        {
            icon: CheckCircle2,
            label: 'Aderência média',
            value: `${aderenciaMedia.toFixed(1)}%`,
            meta: 'Média de aderência do grupo',
            tone: 'emerald',
        },
        {
            icon: XCircle,
            label: 'Rejeição média',
            value: `${rejeicaoMedia.toFixed(1)}%`,
            meta: 'Média de rejeição no período',
            tone: 'rose',
        },
        {
            icon: Truck,
            label: corridasTitle,
            value: totalCorridas.toLocaleString('pt-BR'),
            meta: corridasSubtext,
            tone: 'blue',
        },
        {
            icon: Clock,
            label: 'Total de horas',
            value: totalHoras,
            meta: 'Horas totais do conjunto filtrado',
            tone: 'amber',
        },
    ];
}
