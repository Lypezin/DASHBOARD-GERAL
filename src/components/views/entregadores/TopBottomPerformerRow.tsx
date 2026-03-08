import React from 'react';
import { Entregador } from '@/types';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';

export type SortMetric = 'aderencia' | 'completadas' | 'horas' | 'rejeicao';

export const metricLabels: Record<SortMetric, string> = {
    aderencia: 'Aderência',
    completadas: 'Completadas',
    horas: 'Horas Online',
    rejeicao: 'Rejeição',
};

export function getMetricValue(e: Entregador, metric: SortMetric): number {
    switch (metric) {
        case 'aderencia': return e.aderencia_percentual;
        case 'completadas': return e.corridas_completadas;
        case 'horas': return e.total_segundos;
        case 'rejeicao': return e.rejeicao_percentual;
    }
}

export function formatMetric(val: number, metric: SortMetric): string {
    switch (metric) {
        case 'aderencia': return `${val.toFixed(1)}%`;
        case 'completadas': return val.toLocaleString('pt-BR');
        case 'horas': return formatarHorasParaHMS(val / 3600);
        case 'rejeicao': return `${val.toFixed(1)}%`;
    }
}

export const PerformerRow = ({ e, i, metric, rank, highlightTop = false, hs }: { e: Entregador, i: number, metric: SortMetric, rank: number, highlightTop?: boolean, hs: any }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className={`w-5 text-center text-xs font-bold ${highlightTop ? 'text-amber-500' : 'text-slate-400'}`}>{rank}</span>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.nome_entregador}</p></div>
        <HealthBadge grade={hs.grade} score={hs.score} />
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums w-20 text-right">{formatMetric(getMetricValue(e, metric), metric)}</span>
    </div>
);
