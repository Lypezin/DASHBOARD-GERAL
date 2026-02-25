'use client';

import React, { useMemo, useState } from 'react';
import { Entregador } from '@/types';
import { ChevronDown, ScatterChart } from 'lucide-react';
import { calculateHealthScore, HealthGrade } from '@/components/ui/HealthBadge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type AxisMetric = 'total_segundos' | 'corridas_completadas' | 'corridas_ofertadas' | 'aderencia_percentual' | 'rejeicao_percentual';

const axisLabels: Record<AxisMetric, string> = {
    total_segundos: 'Horas Online',
    corridas_completadas: 'Completadas',
    corridas_ofertadas: 'Ofertadas',
    aderencia_percentual: 'Aderência %',
    rejeicao_percentual: 'Rejeição %',
};

const gradeColors: Record<HealthGrade, string> = {
    A: '#10b981',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#ef4444',
};

interface CorrelationScatterProps {
    entregadores: Entregador[];
}

export const CorrelationScatter = React.memo(function CorrelationScatter({
    entregadores,
}: CorrelationScatterProps) {
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

        return {
            points,
            xMin: Math.min(...xVals),
            xMax: Math.max(...xVals) || 1,
            yMin: Math.min(...yVals),
            yMax: Math.max(...yVals) || 1,
        };
    }, [entregadores, xAxis, yAxis]);

    if (entregadores.length < 3) return null;

    const svgW = 500;
    const svgH = 300;
    const pad = { top: 15, right: 15, bottom: 30, left: 45 };
    const plotW = svgW - pad.left - pad.right;
    const plotH = svgH - pad.top - pad.bottom;

    const scaleX = (v: number) => pad.left + ((v - chartData.xMin) / (chartData.xMax - chartData.xMin || 1)) * plotW;
    const scaleY = (v: number) => pad.top + plotH - ((v - chartData.yMin) / (chartData.yMax - chartData.yMin || 1)) * plotH;

    // Axis ticks
    const xTicks = Array.from({ length: 5 }, (_, i) => chartData.xMin + (i / 4) * (chartData.xMax - chartData.xMin));
    const yTicks = Array.from({ length: 5 }, (_, i) => chartData.yMin + (i / 4) * (chartData.yMax - chartData.yMin));

    const formatTick = (val: number) => {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        return val.toFixed(val < 10 ? 1 : 0);
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <ScatterChart className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correlação de Métricas</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select value={xAxis} onChange={(e) => setXAxis(e.target.value as AxisMetric)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 pr-6 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.entries(axisLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                        <span className="text-xs text-slate-400">×</span>
                        <div className="relative">
                            <select value={yAxis} onChange={(e) => setYAxis(e.target.value as AxisMetric)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 pr-6 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.entries(axisLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 350 }}>
                    {/* Grid lines */}
                    {yTicks.map((t, i) => (
                        <g key={`y${i}`}>
                            <line x1={pad.left} x2={svgW - pad.right} y1={scaleY(t)} y2={scaleY(t)} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={1} />
                            <text x={pad.left - 5} y={scaleY(t) + 3} textAnchor="end" className="fill-slate-400" fontSize={9}>{formatTick(t)}</text>
                        </g>
                    ))}
                    {xTicks.map((t, i) => (
                        <text key={`x${i}`} x={scaleX(t)} y={svgH - 5} textAnchor="middle" className="fill-slate-400" fontSize={9}>{formatTick(t)}</text>
                    ))}

                    {/* Axis labels */}
                    <text x={svgW / 2} y={svgH - 0} textAnchor="middle" className="fill-slate-500" fontSize={10} fontWeight={600}>
                        {axisLabels[xAxis]}
                    </text>
                    <text x={12} y={svgH / 2} textAnchor="middle" className="fill-slate-500" fontSize={10} fontWeight={600} transform={`rotate(-90, 12, ${svgH / 2})`}>
                        {axisLabels[yAxis]}
                    </text>

                    {/* Points */}
                    {chartData.points.map((p, i) => (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <circle
                                    cx={scaleX(p.x)}
                                    cy={scaleY(p.y)}
                                    r={4}
                                    fill={gradeColors[p.grade]}
                                    opacity={0.7}
                                    className="hover:opacity-100 cursor-pointer transition-opacity"
                                    stroke="white"
                                    strokeWidth={0.5}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {axisLabels[xAxis]}: {p.x.toFixed(1)} | {axisLabels[yAxis]}: {p.y.toFixed(1)}
                                </p>
                                <p className="text-xs">Score: {p.grade} ({p.score})</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </svg>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 justify-center">
                    {(['A', 'B', 'C', 'D'] as HealthGrade[]).map(g => (
                        <div key={g} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gradeColors[g] }} />
                            <span className="text-[10px] text-slate-500">{g}</span>
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
});
