'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface FunnelStage { label: string; value: number; color: string; }

interface ConversionFunnelProps { ofertadas: number; aceitas: number; completadas: number; rejeitadas: number; }

export const ConversionFunnel = React.memo(function ConversionFunnel({ ofertadas, aceitas, completadas, rejeitadas }: ConversionFunnelProps) {
    if (ofertadas === 0) return null;

    const stages: FunnelStage[] = [
        { label: 'Ofertadas', value: ofertadas, color: 'bg-blue-500' },
        { label: 'Aceitas', value: aceitas, color: 'bg-indigo-500' },
        { label: 'Completadas', value: completadas, color: 'bg-emerald-500' },
    ];

    const taxaAceitacao = ofertadas > 0 ? ((aceitas / ofertadas) * 100).toFixed(1) : '0';
    const taxaCompletude = aceitas > 0 ? ((completadas / aceitas) * 100).toFixed(1) : '0';
    const taxaRejeicao = ofertadas > 0 ? ((rejeitadas / ofertadas) * 100).toFixed(1) : '0';

    const maxValue = Math.max(...stages.map(s => s.value));

    return (
        <TooltipProvider delayDuration={0}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Funil de Conversão</h3>
                </div>

                <div className="space-y-3">
                    {stages.map((stage, i) => {
                        const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                        return (
                            <div key={stage.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{stage.label}</span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {stage.value.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                                    <motion.div
                                        className={`h-full ${stage.color} rounded-md`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPct}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                                    />
                                </div>
                                {/* Conversion rate arrow between stages */}
                                {i < stages.length - 1 && (
                                    <div className="flex items-center gap-1 mt-1 ml-2">
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 cursor-help">
                                                    {i === 0 ? `${taxaAceitacao}% aceita` : `${taxaCompletude}% completa`}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{i === 0 ? `${aceitas} de ${ofertadas} aceitas` : `${completadas} de ${aceitas} completadas`}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-help">
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-xs text-slate-500">Rejeição: {taxaRejeicao}%</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{rejeitadas.toLocaleString('pt-BR')} corridas rejeitadas de {ofertadas.toLocaleString('pt-BR')}</p>
                        </TooltipContent>
                    </Tooltip>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Conversão total: {ofertadas > 0 ? ((completadas / ofertadas) * 100).toFixed(1) : 0}%
                    </span>
                </div>
            </div>
        </TooltipProvider>
    );
});
