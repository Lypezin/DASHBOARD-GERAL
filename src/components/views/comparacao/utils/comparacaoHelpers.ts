import { DashboardResumoData, AderenciaDia } from '@/types';

export interface MetricConfig {
    label: string;
    key: string;
    color: string;
    isPercent?: boolean;
    isTime?: boolean;
}

export const COMPARACAO_METRICS: MetricConfig[] = [
    { label: 'Corridas Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-600 dark:text-slate-400' },
    { label: 'Corridas Aceitas', key: 'corridas_aceitas', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Corridas Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Corridas Completadas', key: 'corridas_completadas', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Taxa de Aceitação', key: 'taxa_aceitacao', color: 'text-blue-600 dark:text-blue-400', isPercent: true },
    { label: 'Horas Planejadas', key: 'horas_a_entregar', color: 'text-amber-600 dark:text-amber-400', isTime: true },
    { label: 'Horas Entregues', key: 'horas_entregues', color: 'text-teal-600 dark:text-teal-400', isTime: true },
    { label: 'Aderência', key: 'aderencia_percentual', color: 'text-slate-900 dark:text-white font-bold', isPercent: true }
];

export function getRawValue(dayData: AderenciaDia | undefined, metricKey: string): number | string {
    if (!dayData) return 0;

    if (metricKey === 'taxa_aceitacao') {
        return dayData.taxa_aceitacao ??
            (dayData.corridas_ofertadas ? (dayData.corridas_aceitas || 0) / dayData.corridas_ofertadas * 100 : 0);
    }

    if (metricKey === 'horas_a_entregar') {
        if (dayData.segundos_planejados !== undefined && dayData.segundos_planejados !== null) {
            return dayData.segundos_planejados;
        }
        return dayData.horas_a_entregar || 0;
    }

    if (metricKey === 'horas_entregues') {
        if (dayData.segundos_realizados !== undefined && dayData.segundos_realizados !== null) {
            return dayData.segundos_realizados;
        }
        return dayData.horas_entregues || 0;
    }

    // @ts-ignore - dynamic key access
    return dayData[metricKey] ?? 0;
}

export function formatValue(rawValue: number | string, metric: MetricConfig): string {
    if (metric.isTime) {
        if (typeof rawValue === 'number') {
            const h = Math.floor(rawValue / 3600);
            const m = Math.floor((rawValue % 3600) / 60);
            const s = Math.floor(rawValue % 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return String(rawValue);
    }

    if (metric.isPercent) {
        return `${Number(rawValue).toFixed(1)}%`;
    }

    return Number(rawValue).toLocaleString('pt-BR');
}

export function parseTime(value: number | string): number {
    if (typeof value === 'number') return value;
    const [h, m, s] = String(value).split(':').map(Number);
    return (h * 3600) + (m * 60) + (s || 0);
}

export function calculateVariation(
    currentValue: number | string,
    prevValue: number | string,
    metric: MetricConfig
): number | null {
    let currentNum = typeof currentValue === 'number' ? currentValue : 0;
    let prevNum = typeof prevValue === 'number' ? prevValue : 0;

    if (metric.isTime) {
        currentNum = parseTime(currentValue);
        prevNum = parseTime(prevValue);
    } else {
        currentNum = Number(currentValue);
        prevNum = Number(prevValue);
    }

    if (prevNum > 0) {
        return ((currentNum - prevNum) / prevNum) * 100;
    } else if (currentNum > 0) {
        return 100;
    }
    return 0;
}
