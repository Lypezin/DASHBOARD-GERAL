import React from 'react';
import { Entregador } from '@/types';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';

export type SortMetric = 'aderencia' | 'completadas' | 'horas' | 'rejeicao';

export const metricLabels: Record<SortMetric, string> = {
    aderencia: 'Aderencia',
    completadas: 'Completadas',
    horas: 'Horas Online',
    rejeicao: 'Rejeicao',
};

export function getMetricValue(entregador: Entregador, metric: SortMetric): number {
    switch (metric) {
        case 'aderencia':
            return entregador.aderencia_percentual;
        case 'completadas':
            return entregador.corridas_completadas;
        case 'horas':
            return entregador.total_segundos;
        case 'rejeicao':
            return entregador.rejeicao_percentual;
    }
}

export function formatMetric(value: number, metric: SortMetric): string {
    switch (metric) {
        case 'aderencia':
            return `${value.toFixed(1)}%`;
        case 'completadas':
            return value.toLocaleString('pt-BR');
        case 'horas':
            return formatarHorasParaHMS(value / 3600);
        case 'rejeicao':
            return `${value.toFixed(1)}%`;
    }
}

export const PerformerRow = ({
    e,
    metric,
    rank,
    highlightTop = false,
    hs,
}: {
    e: Entregador;
    metric: SortMetric;
    rank: number;
    highlightTop?: boolean;
    hs: any;
}) => (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <span
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-black ${
                highlightTop
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
            }`}
        >
            {rank}
        </span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {e.nome_entregador}
            </p>
            <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {e.id_entregador}
            </p>
        </div>
        <HealthBadge grade={hs.grade} score={hs.score} />
        <span className="w-24 text-right font-mono text-sm font-black text-slate-900 dark:text-slate-100">
            {formatMetric(getMetricValue(e, metric), metric)}
        </span>
    </div>
);
