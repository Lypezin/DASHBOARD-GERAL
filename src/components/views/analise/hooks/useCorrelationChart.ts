import { useMemo, useState } from 'react';
import { Entregador } from '@/types';
import { calculateHealthScore } from '@/components/ui/HealthBadge';

export type AxisMetric = 'total_segundos' | 'corridas_completadas' | 'corridas_ofertadas' | 'aderencia_percentual' | 'rejeicao_percentual';

export const axisLabels: Record<AxisMetric, string> = {
    total_segundos: 'Horas Online',
    corridas_completadas: 'Completadas',
    corridas_ofertadas: 'Ofertadas',
    aderencia_percentual: 'Aderência %',
    rejeicao_percentual: 'Rejeição %',
};

export function useCorrelationChart(entregadores: Entregador[]) {
    const [xAxis, setXAxis] = useState<AxisMetric>('total_segundos');
    const [yAxis, setYAxis] = useState<AxisMetric>('corridas_completadas');

    const chartData = useMemo(() => {
        if (!entregadores || entregadores.length === 0) return { points: [], xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
        const points = entregadores.map(e => {
            let xVal = Number(e[xAxis]) || 0;
            let yVal = Number(e[yAxis]) || 0;
            if (xAxis === 'total_segundos') xVal = xVal / 3600;
            if (yAxis === 'total_segundos') yVal = yVal / 3600;
            const hs = calculateHealthScore(e.aderencia_percentual, e.corridas_completadas, e.corridas_ofertadas, e.total_segundos);
            return { x: xVal, y: yVal, name: e.nome_entregador, grade: hs.grade, score: hs.score };
        });

        const xVals = points.map(p => p.x);
        const yVals = points.map(p => p.y);
        return { points, xMin: Math.min(...xVals), xMax: Math.max(...xVals) || 1, yMin: Math.min(...yVals), yMax: Math.max(...yVals) || 1 };
    }, [entregadores, xAxis, yAxis]);

    const svgW = 500, svgH = 300, pad = { top: 15, right: 15, bottom: 30, left: 45 };
    const plotW = svgW - pad.left - pad.right;
    const plotH = svgH - pad.top - pad.bottom;

    const scaleX = (v: number) => pad.left + ((v - chartData.xMin) / (chartData.xMax - chartData.xMin || 1)) * plotW;
    const scaleY = (v: number) => pad.top + plotH - ((v - chartData.yMin) / (chartData.yMax - chartData.yMin || 1)) * plotH;

    const xTicks = Array.from({ length: 5 }, (_, i) => chartData.xMin + (i / 4) * (chartData.xMax - chartData.xMin));
    const yTicks = Array.from({ length: 5 }, (_, i) => chartData.yMin + (i / 4) * (chartData.yMax - chartData.yMin));

    const formatTick = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0);

    return { xAxis, setXAxis, yAxis, setYAxis, chartData, svgW, svgH, scaleX, scaleY, pad, xTicks, yTicks, formatTick };
}
