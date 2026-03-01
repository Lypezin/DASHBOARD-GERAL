'use client';

import React from 'react';
import { Entregador } from '@/types';
import { ChevronDown, ScatterChart } from 'lucide-react';
import { HealthGrade } from '@/components/ui/HealthBadge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useCorrelationChart, axisLabels, AxisMetric } from './hooks/useCorrelationChart';

const gradeColors: Record<HealthGrade, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

export const CorrelationScatter = React.memo(function CorrelationScatter({ entregadores }: { entregadores: Entregador[] }) {
    const { xAxis, setXAxis, yAxis, setYAxis, chartData, svgW, svgH, scaleX, scaleY, pad, xTicks, yTicks, formatTick } = useCorrelationChart(entregadores);
    if (entregadores.length < 3) return null;

    return (
        <TooltipProvider delayDuration={0}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2"><ScatterChart className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correlação de Métricas</h3></div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select value={xAxis} onChange={(e) => setXAxis(e.target.value as AxisMetric)} className="appearance-none bg-white dark:bg-slate-900 border rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none">{Object.entries(axisLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                        <span className="text-xs text-slate-400">×</span>
                        <div className="relative">
                            <select value={yAxis} onChange={(e) => setYAxis(e.target.value as AxisMetric)} className="appearance-none bg-white dark:bg-slate-900 border rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none">{Object.entries(axisLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 350 }}>
                    {yTicks.map((t, i) => (
                        <g key={`y${i}`}><line x1={pad.left} x2={svgW - pad.right} y1={scaleY(t)} y2={scaleY(t)} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={1} /><text x={pad.left - 5} y={scaleY(t) + 3} textAnchor="end" className="fill-slate-400" fontSize={9}>{formatTick(t)}</text></g>
                    ))}
                    {xTicks.map((t, i) => <text key={`x${i}`} x={scaleX(t)} y={svgH - 5} textAnchor="middle" className="fill-slate-400" fontSize={9}>{formatTick(t)}</text>)}

                    <text x={svgW / 2} y={svgH - 0} textAnchor="middle" className="fill-slate-500" fontSize={10} fontWeight={600}>{axisLabels[xAxis]}</text>
                    <text x={12} y={svgH / 2} textAnchor="middle" className="fill-slate-500" fontSize={10} fontWeight={600} transform={`rotate(-90, 12, ${svgH / 2})`}>{axisLabels[yAxis]}</text>

                    {chartData.points.map((p, i) => (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild><circle cx={scaleX(p.x)} cy={scaleY(p.y)} r={4} fill={gradeColors[p.grade]} opacity={0.7} className="hover:opacity-100 cursor-pointer" stroke="white" strokeWidth={0.5} /></TooltipTrigger>
                            <TooltipContent><p className="font-medium">{p.name}</p><p className="text-xs opacity-80">{axisLabels[xAxis]}: {p.x.toFixed(1)} | {axisLabels[yAxis]}: {p.y.toFixed(1)}</p><p className="text-xs">Score: {p.grade} ({p.score})</p></TooltipContent>
                        </Tooltip>
                    ))}
                </svg>

                <div className="flex items-center gap-4 mt-3 justify-center">
                    {(Object.keys(gradeColors) as HealthGrade[]).map(g => (
                        <div key={g} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gradeColors[g] }} /><span className="text-[10px] text-slate-500">{g}</span></div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
});
