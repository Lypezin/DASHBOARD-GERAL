import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Palette,
    Type as TypeSize,
    Highlighter
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlideElement } from '@/types/presentation';

interface MediaToolbarControlsProps {
    selectedElement: SlideElement;
    onUpdateElement?: (updates: Partial<SlideElement>) => void;
}

export const MediaToolbarControls: React.FC<MediaToolbarControlsProps> = ({
    selectedElement,
    onUpdateElement
}) => {
    if (!onUpdateElement) return null;

    const handleStyleUpdate = (key: keyof NonNullable<SlideElement['style']>, value: string) => {
        const currentStyle = selectedElement.style || {};
        onUpdateElement({
            style: {
                ...currentStyle,
                [key]: value
            }
        });
    };

    return (
        <>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />

            {/* Bold */}
            <Button
                variant={selectedElement.style?.fontWeight === 'bold' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => handleStyleUpdate('fontWeight', selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
            >
                <Bold className="w-4 h-4" />
            </Button>

            {/* Italic */}
            <Button
                variant={selectedElement.style?.fontStyle === 'italic' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => handleStyleUpdate('fontStyle', selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
            >
                <Italic className="w-4 h-4" />
            </Button>

            {/* Font Size */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <TypeSize className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                    <div className="grid grid-cols-1 gap-1">
                        {['1.25rem', '1.5rem', '1.875rem', '2.25rem', '3rem', '4rem'].map(size => (
                            <Button
                                key={size}
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => handleStyleUpdate('fontSize', size)}
                            >
                                <span style={{ fontSize: size }} className="truncate">Aa ({size})</span>
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Text Color */}
            <div className="relative flex items-center justify-center">
                <input
                    type="color"
                    className="absolute opacity-0 w-8 h-8 cursor-pointer"
                    value={selectedElement.style?.color || '#000000'}
                    onChange={(e) => handleStyleUpdate('color', e.target.value)}
                />
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 pointer-events-none">
                    <Palette className="w-4 h-4" style={{ color: selectedElement.style?.color }} />
                </Button>
            </div>

            {/* Background Color */}
            <div className="relative flex items-center justify-center">
                <input
                    type="color"
                    className="absolute opacity-0 w-8 h-8 cursor-pointer"
                    title="Cor de Fundo"
                    value={selectedElement.style?.bg === 'transparent' ? '#ffffff' : selectedElement.style?.bg || '#ffffff'}
                    onChange={(e) => handleStyleUpdate('bg', e.target.value)}
                />
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 pointer-events-none">
                    <Highlighter className="w-4 h-4" style={{ color: selectedElement.style?.bg && selectedElement.style.bg !== 'transparent' ? selectedElement.style.bg : undefined }} />
                </Button>
            </div>
        </>
    );
};
