import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

export interface TagData { id: string; tag_name: string; color: string; }

export const tagColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function useTagManager(entregadorId: string, organizationId?: string, onUpdate?: () => void) {
    const [tags, setTags] = useState<TagData[]>([]);
    const [availableTags, setAvailableTags] = useState<TagData[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(tagColors[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadTags = useCallback(async () => {
        try {
            const { data: assigned } = await supabase.from('entregador_tag_assignments')
                .select('tag_id, entregador_tags(id, tag_name, color)').eq('entregador_id', entregadorId);
            if (assigned) setTags(assigned.map((a: any) => a.entregador_tags).filter(Boolean));

            const { data: allTags } = await supabase.from('entregador_tags').select('id, tag_name, color').order('tag_name');
            if (allTags) setAvailableTags(allTags);
        } catch (err: unknown) { safeLog.error('Erro:', err); }
    }, [entregadorId]);

    useEffect(() => { loadTags(); }, [loadTags]);

    const createTag = useCallback(async () => {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('entregador_tags').insert({ tag_name: newTagName.trim(), color: selectedColor, organization_id: organizationId || null }).select().single();
            if (error) throw error;
            if (data) await supabase.from('entregador_tag_assignments').insert({ entregador_id: entregadorId, tag_id: data.id });
            setNewTagName(''); setShowCreate(false); loadTags(); onUpdate?.();
        } catch (err: unknown) { safeLog.error('Erro ao criar tag:', err); } finally { setLoading(false); }
    }, [newTagName, selectedColor, organizationId, entregadorId, loadTags, onUpdate]);

    const assignTag = useCallback(async (tagId: string) => {
        try {
            await supabase.from('entregador_tag_assignments').insert({ entregador_id: entregadorId, tag_id: tagId }); loadTags(); onUpdate?.();
        } catch (err: unknown) { safeLog.error('Erro:', err); }
    }, [entregadorId, loadTags, onUpdate]);

    const removeTag = useCallback(async (tagId: string) => {
        try {
            await supabase.from('entregador_tag_assignments').delete().eq('entregador_id', entregadorId).eq('tag_id', tagId); loadTags(); onUpdate?.();
        } catch (err: unknown) { safeLog.error('Erro:', err); }
    }, [entregadorId, loadTags, onUpdate]);

    const assignedIds = new Set(tags.map(t => t.id));
    const unassigned = availableTags.filter(t => !assignedIds.has(t.id));

    return { tags, unassigned, newTagName, setNewTagName, selectedColor, setSelectedColor, showCreate, setShowCreate, loading, createTag, assignTag, removeTag };
}
