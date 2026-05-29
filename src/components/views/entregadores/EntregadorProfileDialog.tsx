'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Entregador } from '@/types';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Clock, Target, Hash, Activity, Store } from 'lucide-react';
import { TagManager } from './TagManager';
import { MetaEditor } from './MetaEditor';
import { useEntregadorDetail } from './hooks/useEntregadorDetail';
import { safeLog } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { buildDedicadoFilterPayload } from '../dedicado/rpcFallback';
import {
    calculateNormalAderencia,
    normalizeMetricNumber,
} from '../dedicado/metrics';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';

interface OrigemBreakdownRow {
    origem: string;
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
    segundos_realizados: number;
    aderencia_percentual: number;
    rejeicao_percentual: number;
    completude_percentual: number;
}

interface OrigemBreakdownPayload {
    origens?: OrigemBreakdownRow[];
    periodo_resolvido?: {
        ano?: number | null;
        semana?: number | null;
        auto_semana?: boolean;
    };
}

interface Props {
    entregador: Entregador | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId?: string;
    variant?: 'entregadores' | 'dedicado';
    filterPayload?: FilterPayload;
}

export const EntregadorProfileDialog = React.memo(function EntregadorProfileDialog({
    entregador,
    open,
    onOpenChange,
    organizationId,
    variant = 'entregadores',
    filterPayload,
}: Props) {
    const isDedicado = variant === 'dedicado';
    const { detail, loading, loadDetail } = useEntregadorDetail(entregador, open, organizationId, !isDedicado);
    const [origemBreakdown, setOrigemBreakdown] = React.useState<OrigemBreakdownRow[]>([]);
    const [origemLoading, setOrigemLoading] = React.useState(false);

    const origemPayloadKey = React.useMemo(() => {
        if (!entregador || !isDedicado) return '';

        return JSON.stringify(buildDedicadoFilterPayload(filterPayload, {
            p_entregador_id: entregador.id_entregador,
        }));
    }, [entregador, filterPayload, isDedicado]);

    React.useEffect(() => {
        let cancelled = false;

        async function loadOrigemBreakdown() {
            if (!open || !isDedicado || !origemPayloadKey) {
                setOrigemBreakdown([]);
                return;
            }

            setOrigemLoading(true);

            try {
                const payload = JSON.parse(origemPayloadKey) as Record<string, unknown>;
                const { data, error } = await fetchDedicadoApi<OrigemBreakdownPayload>('entregador', payload);

                if (cancelled) return;

                if (error) {
                    safeLog.error('Erro ao carregar origens do entregador:', error);
                    setOrigemBreakdown([]);
                    return;
                }

                setOrigemBreakdown(
                    Array.isArray(data?.origens)
                        ? data.origens.map((row) => ({
                            ...row,
                            corridas_ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
                            corridas_aceitas: normalizeMetricNumber(row.corridas_aceitas),
                            corridas_rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
                            corridas_completadas: normalizeMetricNumber(row.corridas_completadas),
                            segundos_realizados: normalizeMetricNumber(row.segundos_realizados),
                            aderencia_percentual: calculateNormalAderencia(row.corridas_completadas, row.corridas_ofertadas),
                            rejeicao_percentual: normalizeMetricNumber(row.rejeicao_percentual),
                            completude_percentual: normalizeMetricNumber(row.completude_percentual),
                        }))
                        : []
                );
            } catch (error) {
                if (!cancelled) {
                    safeLog.error('Erro inesperado ao carregar origens do entregador:', error);
                    setOrigemBreakdown([]);
                }
            } finally {
                if (!cancelled) setOrigemLoading(false);
            }
        }

        void loadOrigemBreakdown();

        return () => {
            cancelled = true;
        };
    }, [open, isDedicado, origemPayloadKey]);

    if (!entregador) return null;

    const hs = calculateHealthScore(
        entregador.aderencia_percentual,
        entregador.corridas_completadas,
        entregador.corridas_ofertadas,
        entregador.total_segundos
    );

    const metrics = [
        { label: 'Horas online', value: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600), icon: Clock, color: 'text-blue-600' },
        { label: 'Aderencia', value: `${entregador.aderencia_percentual.toFixed(1)}%`, icon: Target, color: 'text-emerald-600' },
        { label: 'Completadas', value: entregador.corridas_completadas.toLocaleString('pt-BR'), icon: Activity, color: 'text-sky-600' },
        { label: 'Ofertadas', value: entregador.corridas_ofertadas.toLocaleString('pt-BR'), icon: Hash, color: 'text-slate-600' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                'subtle-scrollbar max-h-[88vh] overflow-y-auto rounded-[1.9rem] border border-slate-200/80 bg-white/96 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.48)] dark:border-slate-800/80 dark:bg-slate-950/94',
                isDedicado ? 'max-w-5xl' : 'max-w-xl'
            )}>
                <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                    <DialogTitle className="flex items-center gap-3">
                        <HealthBadge grade={hs.grade} score={hs.score} size="md" />
                        <div className="min-w-0">
                            <p className="truncate text-lg font-bold">{entregador.nome_entregador}</p>
                            <p className="truncate text-xs text-slate-500">{entregador.id_entregador}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="mb-1 flex items-center gap-2">
                                <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
                            </div>
                            <p className="text-base font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
                        </div>
                    ))}
                </div>

                {isDedicado ? (
                    <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_24px_-18px_rgba(37,99,235,0.8)]">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">Performance por origem</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Horas e corridas separadas por restaurante/origem</p>
                                </div>
                            </div>
                            {origemLoading ? <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Carregando...</span> : null}
                        </div>

                        {origemBreakdown.length > 0 ? (
                            <div className="subtle-scrollbar max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                    <span>Origem</span>
                                    <span className="text-right">Horas</span>
                                    <span className="text-right">Ofertadas</span>
                                    <span className="text-right">Aceitas</span>
                                    <span className="text-right">Rejeitadas</span>
                                    <span className="text-right">Concluidas</span>
                                    <span className="text-right">Aderencia</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {origemBreakdown.map((row) => (
                                        <div key={row.origem} className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 px-4 py-3 text-xs">
                                            <span className="min-w-0 truncate font-bold text-slate-800 dark:text-slate-100" title={row.origem}>{row.origem}</span>
                                            <span className="text-right font-mono text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(row.segundos_realizados / 3600)}</span>
                                            <span className="text-right tabular-nums text-slate-600 dark:text-slate-400">{row.corridas_ofertadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.corridas_aceitas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-rose-600 dark:text-rose-400">{row.corridas_rejeitadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-sky-600 dark:text-sky-300">{row.corridas_completadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{row.aderencia_percentual.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-4 text-center text-xs text-slate-500 dark:border-blue-900/60 dark:bg-slate-950/40 dark:text-slate-400">
                                {origemLoading ? 'Carregando origens...' : 'Nenhum detalhamento por origem encontrado para o filtro atual.'}
                            </div>
                        )}
                    </div>
                ) : null}

                {!isDedicado ? (
                    <>
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tags</p>
                            <TagManager entregadorId={entregador.id_entregador} organizationId={organizationId} onUpdate={loadDetail} />
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Metas</p>
                            <MetaEditor entregadorId={entregador.id_entregador} organizationId={organizationId} metas={detail?.metas || []} onUpdate={loadDetail} />
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Historico recente</p>
                            {detail?.history && detail.history.length > 0 ? (
                                <div className="subtle-scrollbar max-h-44 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/70 dark:bg-slate-900/70">
                                    {detail.history.map((historyItem) => (
                                        <div key={historyItem.id} className="flex items-center gap-2 text-xs">
                                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                                            <span className="text-slate-600 dark:text-slate-300">{historyItem.event_type.replace(/_/g, ' ')}</span>
                                            <span className="ml-auto text-[10px] text-slate-400">{new Date(historyItem.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400">Sem registros</span>
                            )}
                        </div>
                    </>
                ) : null}

                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[1.9rem] bg-white/55 dark:bg-slate-950/55">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
});
