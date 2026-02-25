'use client';

import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Target } from 'lucide-react';

interface MetaData {
    id: string;
    metric: string;
    target_value: number;
    active: boolean;
}

interface MetaEditorProps {
    entregadorId: string;
    organizationId?: string;
    metas: MetaData[];
    onUpdate: () => void;
}

const metricOptions = [
    { value: 'aderencia_percentual', label: 'Aderência (%)' },
    { value: 'corridas_completadas', label: 'Corridas Completadas' },
    { value: 'horas_online', label: 'Horas Online' },
    { value: 'taxa_aceitacao', label: 'Taxa Aceitação (%)' },
];

export const MetaEditor = React.memo(function MetaEditor({
    entregadorId,
    organizationId,
    metas,
    onUpdate,
}: MetaEditorProps) {
    const [newMetric, setNewMetric] = useState(metricOptions[0].value);
    const [newTarget, setNewTarget] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const addMeta = useCallback(async () => {
        const val = parseFloat(newTarget);
        if (isNaN(val) || val <= 0) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('entregador_metas')
                .upsert({
                    entregador_id: entregadorId,
                    metric: newMetric,
                    target_value: val,
                    organization_id: organizationId || null,
                    active: true,
                }, { onConflict: 'entregador_id,metric,organization_id' });

            if (error) throw error;
            setNewTarget('');
            setShowAdd(false);
            onUpdate();
        } catch (err: unknown) {
            safeLog.error('Erro ao salvar meta:', err instanceof Error ? err.message : 'Unknown');
        } finally {
            setLoading(false);
        }
    }, [entregadorId, newMetric, newTarget, organizationId, onUpdate]);

    const removeMeta = useCallback(async (metaId: string) => {
        try {
            await supabase
                .from('entregador_metas')
                .update({ active: false })
                .eq('id', metaId);
            onUpdate();
        } catch (err: unknown) {
            safeLog.error('Erro:', err instanceof Error ? err.message : 'Unknown');
        }
    }, [onUpdate]);

    return (
        <div className="space-y-2">
            {/* Current metas */}
            {metas.map(meta => {
                const opt = metricOptions.find(o => o.value === meta.metric);
                return (
                    <div key={meta.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-800/50 group">
                        <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{opt?.label || meta.metric}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{meta.target_value}</span>
                            <button
                                onClick={() => removeMeta(meta.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Add new */}
            {!showAdd ? (
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-slate-400 w-full" onClick={() => setShowAdd(true)}>
                    <Plus className="h-3 w-3" /> Adicionar Meta
                </Button>
            ) : (
                <div className="flex items-center gap-2 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                    <select
                        value={newMetric}
                        onChange={(e) => setNewMetric(e.target.value)}
                        className="text-xs bg-transparent border-none focus:outline-none flex-1 text-slate-700 dark:text-slate-300"
                    >
                        {metricOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <Input
                        type="number"
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        placeholder="Valor"
                        className="h-6 w-20 text-xs"
                    />
                    <Button size="sm" className="h-6 text-xs" onClick={addMeta} disabled={loading || !newTarget}>
                        OK
                    </Button>
                    <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="text-xs">✕</span>
                    </button>
                </div>
            )}
        </div>
    );
});
