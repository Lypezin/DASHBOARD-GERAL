
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

interface SlideSidebarItemEditProps {
    editTitle: string;
    setEditTitle: (value: string) => void;
    saveTitle: (e?: React.MouseEvent | React.KeyboardEvent) => void;
    cancelEdit: () => void;
}

export const SlideSidebarItemEdit: React.FC<SlideSidebarItemEditProps> = ({
    editTitle,
    setEditTitle,
    saveTitle,
    cancelEdit
}) => {
    return (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="h-6 text-xs px-1"
                autoFocus
                onBlur={() => saveTitle()}
                onKeyDown={e => {
                    if (e.key === 'Enter') saveTitle(e);
                    if (e.key === 'Escape') cancelEdit();
                }}
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600" onClick={saveTitle}>
                <Check className="w-3 h-3" />
            </Button>
        </div>
    );
};
