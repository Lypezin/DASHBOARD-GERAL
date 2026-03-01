'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { useTagManager, tagColors } from './hooks/useTagManager';

interface TagManagerProps { entregadorId: string; organizationId?: string; onUpdate?: () => void; }

export const TagManager = React.memo(function TagManager({ entregadorId, organizationId, onUpdate }: TagManagerProps) {
    const { tags, unassigned, newTagName, setNewTagName, selectedColor, setSelectedColor, showCreate, setShowCreate, loading, createTag, assignTag, removeTag } = useTagManager(entregadorId, organizationId, onUpdate);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="text-xs gap-1 pr-1">
                        {tag.tag_name}
                        <button onClick={() => removeTag(tag.id)} className="ml-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-slate-400" onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="h-3 w-3" /> Tag
                </Button>
            </div>

            {unassigned.length > 0 && showCreate && (
                <div className="flex flex-wrap gap-1">
                    {unassigned.slice(0, 8).map(tag => (
                        <button key={tag.id} onClick={() => assignTag(tag.id)} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors" style={{ color: tag.color }}>
                            + {tag.tag_name}
                        </button>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="flex items-center gap-2">
                    <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Nova tag..." className="h-7 text-xs flex-1" onKeyDown={(e) => e.key === 'Enter' && createTag()} />
                    <div className="flex gap-1">
                        {tagColors.map(c => (
                            <button key={c} onClick={() => setSelectedColor(c)} className={`w-4 h-4 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={createTag} disabled={loading || !newTagName.trim()}>Criar</Button>
                </div>
            )}
        </div>
    );
});
