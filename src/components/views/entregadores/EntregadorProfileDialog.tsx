'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Entregador } from '@/types';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Clock, Target, Hash, Activity } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TagManager } from './TagManager';
import { MetaEditor } from './MetaEditor';

interface EntregadorProfileDialogProps {
    entregador: Entregador | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId?: string;
}

interface TagData {
    id: string;
    tag_name: string;
    color: string;
}

interface HistoryEntry {
    id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
}

interface MetaData {
    id: string;
    metric: string;
    target_value: number;
    active: boolean;
}

export const EntregadorProfileDialog = React.memo(function EntregadorProfileDialog({
    entregador,
    open,
    onOpenChange,
    organizationId,
}: EntregadorProfileDialogProps) {
    const [detail, setDetail] = useState<{
        tags: TagData[];
        history: HistoryEntry[];
        metas: MetaData[];
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const loadDetail = useCallback(async () => {
        if (!entregador) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_entregador_detail', {
                p_entregador_id: entregador.id_entregador,
                p_org_id: organizationId || null,
            });
            if (error) {
                safeLog.error('Erro ao carregar detalhes:', error);
                return;
            }
            setDetail(data);
        } catch (err: unknown) {
            safeLog.error('Erro:', err instanceof Error ? err.message : 'Unknown');
        } finally {
            setLoading(false);
        }
    }, [entregador, organizationId]);

    useEffect(() => {
        if (open && entregador) {
            loadDetail();
        } else {
            setDetail(null);
        }
    }, [open, entregador, loadDetail]);

    if (!entregador) return null;

    const hs = calculateHealthScore(
        entregador.aderencia_percentual,
        entregador.corridas_completadas,
        entregador.corridas_ofertadas,
        entregador.total_segundos
    );

    const horas = (entregador.total_segundos || 0) / 3600;

    const metricCards = [
        { label: 'Horas Online', value: formatarHorasParaHMS(horas), icon: Clock, color: 'text-blue-600' },
        { label: 'Aderência', value: `${entregador.aderencia_percentual.toFixed(1)}%`, icon: Target, color: 'text-emerald-600' },
        { label: 'Completadas', value: entregador.corridas_completadas.toLocaleString('pt-BR'), icon: Activity, color: 'text-indigo-600' },
        { label: 'Ofertadas', value: entregador.corridas_ofertadas.toLocaleString('pt-BR'), icon: Hash, color: 'text-slate-600' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <TooltipProvider delayDuration={0}>
                            <HealthBadge grade={hs.grade} score={hs.score} size="md" />
                        </TooltipProvider>
                        <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{entregador.nome_entregador}</p>
                            <p className="text-xs text-slate-500 font-mono">{entregador.id_entregador}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                    {metricCards.map(m => (
                        <div key={m.label} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 mb-1">
                                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                                <span className="text-[11px] font-medium text-slate-500">{m.label}</span>
                            </div>
                            <p className="text-base font-bold text-slate-900 dark:text-slate-100">{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tags — Interactive Manager */}
                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</p>
                    <TagManager
                        entregadorId={entregador.id_entregador}
                        organizationId={organizationId}
                        onUpdate={loadDetail}
                    />
                </div>

                {/* Metas — Interactive Editor */}
                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Metas</p>
                    <MetaEditor
                        entregadorId={entregador.id_entregador}
                        organizationId={organizationId}
                        metas={detail?.metas || []}
                        onUpdate={loadDetail}
                    />
                </div>

                {/* Histórico */}
                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Histórico Recente</p>
                    {detail?.history && detail.history.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {detail.history.map(h => (
                                <div key={h.id} className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {h.event_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-slate-400 ml-auto text-[10px]">
                                        {new Date(h.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400">Sem registros</span>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
});
