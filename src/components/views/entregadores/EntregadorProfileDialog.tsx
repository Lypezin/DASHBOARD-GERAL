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
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { RPC_TIMEOUTS } from '@/constants/config';
import { cn } from '@/lib/utils';
import type { FilterPayload } from '@/types/filters';

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

function normalizeNumber(value: unknown) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

export const EntregadorProfileDialog = React.memo(function EntregadorProfileDialog({
    entregador,
    open,
    onOpenChange,
    organizationId,
    variant = 'entregadores',
    filterPayload,
}: Props) {
    const { detail, loading, loadDetail } = useEntregadorDetail(entregador, open, organizationId);
    const isDedicado = variant === 'dedicado';
    const [origemBreakdown, setOrigemBreakdown] = React.useState<OrigemBreakdownRow[]>([]);
    const [origemLoading, setOrigemLoading] = React.useState(false);
    const origemPayloadKey = React.useMemo(() => {
        if (!entregador || !isDedicado) return '';

        const allowed = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
        const payload: Record<string, unknown> = { p_entregador_id: entregador.id_entregador };

        allowed.forEach((key) => {
            const value = filterPayload?.[key];
            if (value !== null && value !== undefined && value !== '') {
                payload[key] = value;
            }
        });

        return JSON.stringify(payload);
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
                const { data, error } = await safeRpc<OrigemBreakdownPayload>('dedicado_entregador_origens', payload, {
                    timeout: RPC_TIMEOUTS.DEFAULT,
                    validateParams: false,
                });

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
                            corridas_ofertadas: normalizeNumber(row.corridas_ofertadas),
                            corridas_aceitas: normalizeNumber(row.corridas_aceitas),
                            corridas_rejeitadas: normalizeNumber(row.corridas_rejeitadas),
                            corridas_completadas: normalizeNumber(row.corridas_completadas),
                            segundos_realizados: normalizeNumber(row.segundos_realizados),
                            aderencia_percentual: normalizeNumber(row.aderencia_percentual),
                            rejeicao_percentual: normalizeNumber(row.rejeicao_percentual),
                            completude_percentual: normalizeNumber(row.completude_percentual),
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

    const hs = calculateHealthScore(entregador.aderencia_percentual, entregador.corridas_completadas, entregador.corridas_ofertadas, entregador.total_segundos);
    const metrics = [
        { label: 'Horas Online', value: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600), icon: Clock, color: 'text-blue-600' },
        { label: 'Aderência', value: `${entregador.aderencia_percentual.toFixed(1)}%`, icon: Target, color: 'text-emerald-600' },
        { label: 'Completadas', value: entregador.corridas_completadas.toLocaleString('pt-BR'), icon: Activity, color: 'text-indigo-600' },
        { label: 'Ofertadas', value: entregador.corridas_ofertadas.toLocaleString('pt-BR'), icon: Hash, color: 'text-slate-600' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('max-h-[85vh] overflow-y-auto', isDedicado ? 'max-w-4xl' : 'max-w-lg')}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <HealthBadge grade={hs.grade} score={hs.score} size="md" />
                        <div><p className="text-lg font-bold">{entregador.nome_entregador}</p><p className="text-xs text-slate-500">{entregador.id_entregador}</p></div>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mt-2">
                    {metrics.map(m => (
                        <div key={m.label} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div className="flex items-center gap-2 mb-1"><m.icon className={`h-3.5 w-3.5 ${m.color}`} /><span className="text-[11px] font-medium text-slate-500">{m.label}</span></div>
                            <p className="text-base font-bold text-slate-900">{m.value}</p>
                        </div>
                    ))}
                </div>

                {isDedicado ? (
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">Performance por origem</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Horas e corridas separadas por restaurante/origem</p>
                                </div>
                            </div>
                            {origemLoading ? (
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Carregando...</span>
                            ) : null}
                        </div>

                        {origemBreakdown.length > 0 ? (
                            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                    <span>Origem</span>
                                    <span className="text-right">Horas</span>
                                    <span className="text-right">Ofertadas</span>
                                    <span className="text-right">Aceitas</span>
                                    <span className="text-right">Rejeitadas</span>
                                    <span className="text-right">Concluídas</span>
                                    <span className="text-right">Aderência</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {origemBreakdown.map((row) => (
                                        <div key={row.origem} className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 px-4 py-3 text-xs">
                                            <span className="min-w-0 truncate font-bold text-slate-800 dark:text-slate-100" title={row.origem}>{row.origem}</span>
                                            <span className="text-right font-mono text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(row.segundos_realizados / 3600)}</span>
                                            <span className="text-right tabular-nums text-slate-600 dark:text-slate-400">{row.corridas_ofertadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.corridas_aceitas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-rose-600 dark:text-rose-400">{row.corridas_rejeitadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right tabular-nums text-indigo-600 dark:text-indigo-400">{row.corridas_completadas.toLocaleString('pt-BR')}</span>
                                            <span className="text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{row.aderencia_percentual.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-blue-200 bg-white/70 p-4 text-center text-xs text-slate-500 dark:border-blue-900/60 dark:bg-slate-950/40 dark:text-slate-400">
                                {origemLoading ? 'Carregando origens...' : 'Nenhum detalhamento por origem encontrado para o filtro atual.'}
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="mt-4"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</p><TagManager entregadorId={entregador.id_entregador} organizationId={organizationId} onUpdate={loadDetail} /></div>
                <div className="mt-4"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Metas</p><MetaEditor entregadorId={entregador.id_entregador} organizationId={organizationId} metas={detail?.metas || []} onUpdate={loadDetail} /></div>

                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Histórico Recente</p>
                    {detail?.history && detail.history.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {detail.history.map(h => (
                                <div key={h.id} className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" /><span className="text-slate-600">{h.event_type.replace(/_/g, ' ')}</span><span className="text-slate-400 ml-auto text-[10px]">{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            ))}
                        </div>
                    ) : <span className="text-xs text-slate-400">Sem registros</span>}
                </div>

                {loading && <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center rounded-lg"><div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" /></div>}
            </DialogContent>
        </Dialog>
    );
});
