
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
            className="fixed pointer-events-none z-[100002] will-change-transform flex items-center justify-center"
            style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {tool === 'laser' ? (
                <div className="relative flex items-center justify-center w-8 h-8 pointer-events-none">
                    {/* Pulsing halo */}
                    <div className="absolute w-8 h-8 rounded-full bg-red-500/35 animate-ping pointer-events-none" />
                    {/* Dynamic neon core */}
                    <div className="w-4.5 h-4.5 rounded-full bg-red-600 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] border border-red-300 pointer-events-none" />
                </div>
            ) : (
                <div className="w-4 h-4 rounded-full bg-blue-400/80 border-2 border-white shadow-md pointer-events-none" />
            )}
        </div>
    );
};
