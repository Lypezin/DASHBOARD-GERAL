'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Entregador } from '@/types';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Clock, Target, Hash, Activity } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TagManager } from './TagManager';
import { MetaEditor } from './MetaEditor';
import { useEntregadorDetail } from './hooks/useEntregadorDetail';

interface Props { entregador: Entregador | null; open: boolean; onOpenChange: (open: boolean) => void; organizationId?: string; }

export const EntregadorProfileDialog = React.memo(function EntregadorProfileDialog({ entregador, open, onOpenChange, organizationId }: Props) {
    const { detail, loading, loadDetail } = useEntregadorDetail(entregador, open, organizationId);
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
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <TooltipProvider delayDuration={0}><HealthBadge grade={hs.grade} score={hs.score} size="md" /></TooltipProvider>
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
