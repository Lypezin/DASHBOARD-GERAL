import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

export const metricOptions = [
    { value: 'aderencia_percentual', label: 'Aderência (%)' },
    { value: 'corridas_completadas', label: 'Corridas Completadas' },
    { value: 'horas_online', label: 'Horas Online' },
    { value: 'taxa_aceitacao', label: 'Taxa Aceitação (%)' },
];

export function useMetaEditor(entregadorId: string, organizationId: string | undefined, onUpdate: () => void) {
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

    return {
        newMetric, setNewMetric,
        newTarget, setNewTarget,
        loading,
        showAdd, setShowAdd,
        addMeta, removeMeta,
        metricOptions
    };
}
