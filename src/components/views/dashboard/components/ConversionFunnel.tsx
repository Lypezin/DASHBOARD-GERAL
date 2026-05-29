'use client';

import React from 'react';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FunnelStage { label: string; value: number; color: string; }

interface ConversionFunnelProps { ofertadas: number; aceitas: number; completadas: number; rejeitadas: number; }

export const ConversionFunnel = React.memo(function ConversionFunnel({ ofertadas, aceitas, completadas, rejeitadas }: ConversionFunnelProps) {
    if (ofertadas === 0) return null;

    const stages: FunnelStage[] = [
        { label: 'Ofertadas', value: ofertadas, color: 'bg-blue-500' },
        { label: 'Aceitas', value: aceitas, color: 'bg-sky-500' },
        { label: 'Completadas', value: completadas, color: 'bg-emerald-500' },
    ];

    const taxaAceitacao = ofertadas > 0 ? ((aceitas / ofertadas) * 100).toFixed(1) : '0';
    const taxaCompletude = aceitas > 0 ? ((completadas / aceitas) * 100).toFixed(1) : '0';
    const taxaRejeicao = ofertadas > 0 ? ((rejeitadas / ofertadas) * 100).toFixed(1) : '0';

    const maxValue = Math.max(...stages.map(s => s.value));

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Funil de Conversao</h3>
            </div>

            <div className="space-y-3">
                {stages.map((stage, i) => {
                    const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                    return (
                        <div key={stage.label}>
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{stage.label}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {stage.value.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="h-7 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                                <div
                                    className={`h-full rounded-md ${stage.color} transition-[width] duration-700`}
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            {i < stages.length - 1 ? (
                                <div className="ml-2 mt-1 flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                {i === 0 ? `${taxaAceitacao}% aceita` : `${taxaCompletude}% completa`}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{i === 0 ? `${aceitas} de ${ofertadas} aceitas` : `${completadas} de ${aceitas} completadas`}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-xs text-slate-500">Rejeicao: {taxaRejeicao}%</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{rejeitadas.toLocaleString('pt-BR')} corridas rejeitadas de {ofertadas.toLocaleString('pt-BR')}</p>
                    </TooltipContent>
                </Tooltip>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Conversao total: {ofertadas > 0 ? ((completadas / ofertadas) * 100).toFixed(1) : 0}%
                </span>
            </div>
        </div>
    );
});
