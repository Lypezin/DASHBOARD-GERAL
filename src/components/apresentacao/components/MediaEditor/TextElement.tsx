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
    return (
        <motion.div
            {...commonProps}
            className={`text-center font-semibold pointer-events-auto text-slate-900 drop-shadow-xl p-4 ${isSelected ? 'ring-2 ring-blue-500 rounded border border-blue-200/50' : ''}`}
        >
            <span className="text-xl md:text-3xl select-none whitespace-pre-wrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.8)' }}>
                {element.content}
            </span>
        </motion.div>
    );
};
