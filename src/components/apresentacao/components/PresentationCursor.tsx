
import React, { useEffect, useRef } from 'react';
import { ToolType } from '@/components/apresentacao/components/PresentationInteractionLayer';

interface PresentationCursorProps {
    tool: ToolType;
}

export const PresentationCursor: React.FC<PresentationCursorProps> = ({ tool }) => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            }
        };

        if (tool !== 'pen') {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [tool]);

    if (tool === 'pen') return null;

    return (
        <div
            ref={cursorRef}
            className={`fixed w-4 h-4 rounded-full pointer-events-none transition-colors duration-200 mix-blend-screen
            ${tool === 'laser'
                    ? 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                    : 'bg-blue-400/80 border-2 border-white shadow-sm'
                }`}
            style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
                zIndex: 100002,
                willChange: 'transform'
            }}
        />
    );
};
