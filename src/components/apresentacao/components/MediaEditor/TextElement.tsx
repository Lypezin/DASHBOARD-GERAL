import React from 'react';
import { motion } from 'framer-motion';
import { SlideElement } from '@/types/presentation';

interface TextElementProps {
    element: SlideElement;
    isSelected: boolean;
    commonProps: any;
}

export const TextElement: React.FC<TextElementProps> = ({
    element,
    isSelected,
    commonProps
}) => {
    const textWidth = element.width || 520;
    const backgroundColor = element.style?.bg || 'transparent';

    return (
        <motion.div
            {...commonProps}
            className={`text-center pointer-events-auto ${isSelected ? 'ring-2 ring-blue-500 rounded-lg border border-blue-200/50' : ''}`}
            style={{
                ...commonProps.style,
                width: textWidth,
                maxWidth: '86%',
            }}
        >
            <span
                className="block min-h-[48px] w-full select-none whitespace-pre-wrap break-words rounded-lg px-5 py-3 leading-tight"
                style={{
                    textShadow: backgroundColor === 'transparent' ? '0 2px 10px rgba(255,255,255,0.72)' : 'none',
                    color: element.style?.color || '#0f172a',
                    fontWeight: element.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                    fontStyle: element.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                    fontSize: element.style?.fontSize || '2.25rem',
                    backgroundColor,
                    boxShadow: backgroundColor === 'transparent' ? 'none' : '0 18px 42px rgba(15,23,42,0.16)',
                }}
            >
                {element.content}
            </span>
        </motion.div>
    );
};
