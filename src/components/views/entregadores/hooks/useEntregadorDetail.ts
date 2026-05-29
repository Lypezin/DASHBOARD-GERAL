import { useState, useCallback, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { Entregador } from '@/types';
import { postAppApiData } from '@/utils/app/fetchAppApi';

export interface HistoryEntry { id: string; event_type: string; event_data: Record<string, unknown>; created_at: string; }
export interface MetaData { id: string; metric: string; target_value: number; active: boolean; }
export interface TagData { id: string; tag_name: string; color: string; }

export function useEntregadorDetail(entregador: Entregador | null, open: boolean, organizationId?: string, enabled: boolean = true) {
    const [detail, setDetail] = useState<{ tags: TagData[]; history: HistoryEntry[]; metas: MetaData[]; } | null>(null);
    const [loading, setLoading] = useState(false);

    const loadDetail = useCallback(async () => {
        if (!entregador || !enabled) return;
        setLoading(true);
        try {
            const { data, error } = await postAppApiData<{
                tags: TagData[];
                history: HistoryEntry[];
                metas: MetaData[];
            }>('/api/app/entregador-detail', {
                entregadorId: entregador.id_entregador,
                organizationId: organizationId || null,
            });
            if (error) { safeLog.error('Erro carregar detalhe:', error); return; }
            setDetail(data);
        } catch (err) { safeLog.error('Erro:', err); } finally { setLoading(false); }
    }, [enabled, entregador, organizationId]);

    useEffect(() => {
        if (open && entregador && enabled) loadDetail();
        else setDetail(null);
    }, [enabled, open, entregador, loadDetail]);

    return { detail, loading, loadDetail };
}
