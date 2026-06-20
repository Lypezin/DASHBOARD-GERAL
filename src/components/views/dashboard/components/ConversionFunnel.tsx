'use client';

import React from 'react';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FunnelStage { label: string; value: number; color: string; }

interface ConversionFunnelProps { ofertadas: number; aceitas: number; completadas: number; rejeitadas: number; }

export const ConversionFunnel = React.memo(function ConversionFunnel({ ofertadas, aceitas, completadas, rejeitadas }: ConversionFunnelProps) {
    if (ofertadas === 0) return null;

    const stages: FunnelStage[] = [
        { label: 'Ofertadas', value: ofertadas, color: 'bg-primary' },
        { label: 'Aceitas', value: aceitas, color: 'bg-sky-500' },
        { label: 'Completadas', value: completadas, color: 'bg-emerald-500' },
    ];

    const taxaAceitacao = ofertadas > 0 ? ((aceitas / ofertadas) * 100).toFixed(1) : '0';
    const taxaCompletude = aceitas > 0 ? ((completadas / aceitas) * 100).toFixed(1) : '0';
    const taxaRejeicao = ofertadas > 0 ? ((rejeitadas / ofertadas) * 100).toFixed(1) : '0';

    const maxValue = Math.max(...stages.map(s => s.value));

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="mb-4 flex items-center gap-2 px-0.5">
                <TrendingDown className="h-4 w-4 text-muted-foreground/80" />
                <h3 className="text-sm font-bold text-foreground font-outfit">Funil de Conversão</h3>
            </div>

            <div className="space-y-4">
                {stages.map((stage, i) => {
                    const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                    return (
                        <div key={stage.label} className="space-y-1">
                            <div className="flex items-center justify-between px-0.5">
                                <span className="text-xs font-semibold text-muted-foreground">{stage.label}</span>
                                <span className="text-xs font-mono font-bold text-foreground">
                                    {stage.value.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="h-6 overflow-hidden rounded-md bg-muted">
                                <div
                                    className={`h-full rounded-md ${stage.color} transition-[width] duration-300`}
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            {i < stages.length - 1 ? (
                                <div className="ml-2 mt-1 flex items-center gap-1">
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/45" />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help text-[10px] font-semibold text-muted-foreground/75 hover:text-foreground transition-colors">
                                                {i === 0 ? `${taxaAceitacao}% aceita` : `${taxaCompletude}% completa`}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="font-bold border border-border">
                                            <p>{i === 0 ? `${aceitas} de ${ofertadas} aceitas` : `${completadas} de ${aceitas} completadas`}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 px-0.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1.5 hover:opacity-80 transition-opacity">
                            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-xs font-semibold text-muted-foreground">Rejeição: {taxaRejeicao}%</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="font-bold border border-border">
                        <p>{rejeitadas.toLocaleString('pt-BR')} corridas rejeitadas de {ofertadas.toLocaleString('pt-BR')}</p>
                    </TooltipContent>
                </Tooltip>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Conversão total: {ofertadas > 0 ? ((completadas / ofertadas) * 100).toFixed(1) : 0}%
                </span>
            </div>
        </div>
    );
});

ConversionFunnel.displayName = 'ConversionFunnel';
