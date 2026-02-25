'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Tag } from 'lucide-react';

interface TagData {
    id: string;
    tag_name: string;
    color: string;
}

interface TagManagerProps {
    entregadorId: string;
    organizationId?: string;
    onUpdate?: () => void;
}

const tagColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const TagManager = React.memo(function TagManager({
    entregadorId,
    organizationId,
    onUpdate,
}: TagManagerProps) {
    const [tags, setTags] = useState<TagData[]>([]);
    const [availableTags, setAvailableTags] = useState<TagData[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(tagColors[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadTags = useCallback(async () => {
        try {
            // Load assigned tags
            const { data: assigned } = await supabase
                .from('entregador_tag_assignments')
                .select('tag_id, entregador_tags(id, tag_name, color)')
                .eq('entregador_id', entregadorId);

            if (assigned) {
                setTags(assigned.map((a: any) => a.entregador_tags).filter(Boolean));
            }

            // Load all available tags
            const { data: allTags } = await supabase
                .from('entregador_tags')
                .select('id, tag_name, color')
                .order('tag_name');

            if (allTags) setAvailableTags(allTags);
        } catch (err: unknown) {
            safeLog.error('Erro:', err instanceof Error ? err.message : 'Unknown');
        }
    }, [entregadorId]);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    const createTag = useCallback(async () => {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('entregador_tags')
                .insert({ tag_name: newTagName.trim(), color: selectedColor, organization_id: organizationId || null })
                .select()
                .single();

            if (error) throw error;

            // Assign it immediately
            if (data) {
                await supabase
                    .from('entregador_tag_assignments')
                    .insert({ entregador_id: entregadorId, tag_id: data.id });
            }

            setNewTagName('');
            setShowCreate(false);
            loadTags();
            onUpdate?.();
        } catch (err: unknown) {
            safeLog.error('Erro ao criar tag:', err instanceof Error ? err.message : 'Unknown');
        } finally {
            setLoading(false);
        }
    }, [newTagName, selectedColor, organizationId, entregadorId, loadTags, onUpdate]);

    const assignTag = useCallback(async (tagId: string) => {
        try {
            await supabase
                .from('entregador_tag_assignments')
                .insert({ entregador_id: entregadorId, tag_id: tagId });
            loadTags();
            onUpdate?.();
        } catch (err: unknown) {
            safeLog.error('Erro:', err instanceof Error ? err.message : 'Unknown');
        }
    }, [entregadorId, loadTags, onUpdate]);

    const removeTag = useCallback(async (tagId: string) => {
        try {
            await supabase
                .from('entregador_tag_assignments')
                .delete()
                .eq('entregador_id', entregadorId)
                .eq('tag_id', tagId);
            loadTags();
            onUpdate?.();
        } catch (err: unknown) {
            safeLog.error('Erro:', err instanceof Error ? err.message : 'Unknown');
        }
    }, [entregadorId, loadTags, onUpdate]);

    const assignedIds = new Set(tags.map(t => t.id));
    const unassigned = availableTags.filter(t => !assignedIds.has(t.id));

    return (
        <div className="space-y-3">
            {/* Assigned tags */}
            <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="text-xs gap-1 pr-1">
                        {tag.tag_name}
                        <button onClick={() => removeTag(tag.id)} className="ml-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5">
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-slate-400" onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="h-3 w-3" /> Tag
                </Button>
            </div>

            {/* Quick assign */}
            {unassigned.length > 0 && showCreate && (
                <div className="flex flex-wrap gap-1">
                    {unassigned.slice(0, 8).map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => assignTag(tag.id)}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            style={{ color: tag.color }}
                        >
                            + {tag.tag_name}
                        </button>
                    ))}
                </div>
            )}

            {/* Create new */}
            {showCreate && (
                <div className="flex items-center gap-2">
                    <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nova tag..."
                        className="h-7 text-xs flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && createTag()}
                    />
                    <div className="flex gap-1">
                        {tagColors.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`w-4 h-4 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={createTag} disabled={loading || !newTagName.trim()}>
                        Criar
                    </Button>
                </div>
            )}
        </div>
    );
});
