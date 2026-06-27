
import React, { useEffect, useRef } from 'react';
import { ToolType } from '@/components/apresentacao/components/PresentationInteractionLayer';

interface PresentationCursorProps {
    tool: ToolType;
}

export const PresentationCursor: React.FC<PresentationCursorProps> = ({ tool }) => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let frameId: number | null = null;
        let nextX = 0;
        let nextY = 0;

        const updateCursor = () => {
            frameId = null;
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${nextX}px, ${nextY}px) translate(-50%, -50%)`;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            nextX = e.clientX;
            nextY = e.clientY;

            if (frameId === null) {
                frameId = window.requestAnimationFrame(updateCursor);
            }
        };

        if (tool !== 'pen') {
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
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
