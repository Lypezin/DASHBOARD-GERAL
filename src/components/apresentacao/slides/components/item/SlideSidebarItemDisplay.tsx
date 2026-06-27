
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

interface SlideSidebarItemDisplayProps {
    displayName: string;
    isActive: boolean;
    isMediaSlide: boolean;
    onUpdateTitle?: (id: string, newTitle: string) => void;
    startEditing: (e: React.MouseEvent) => void;
}

export const SlideSidebarItemDisplay: React.FC<SlideSidebarItemDisplayProps> = ({
    displayName,
    isActive,
    isMediaSlide,
    onUpdateTitle,
    startEditing
}) => {
    return (
        <div className="flex items-center justify-between group/title">
            <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {displayName}
            </p>
            {isMediaSlide && onUpdateTitle && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover/title:opacity-100 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400"
                    onClick={startEditing}
                >
                    <Edit2 className="w-3 h-3" />
                </Button>
            )}
        </div>
    );
};
