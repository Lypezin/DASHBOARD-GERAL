import React, { useEffect, useRef, useState } from 'react';

export type ToolType = 'cursor' | 'laser' | 'pen' | 'eraser';

interface PresentationInteractionLayerProps {
    tool: ToolType;
    isActive: boolean;
}

export const PresentationInteractionLayer: React.FC<PresentationInteractionLayerProps> = ({ tool, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null); // Ref for direct DOM manipulation

    // NO STATE for mouse position - direct DOM manipulation for performance
    const [isDrawing, setIsDrawing] = useState(false);

    // Optimized Cursor movement (Laser/Ball)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                // Direct DOM update avoids React render cycle on every frame
                cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            }
        };

        // Only attach if tool uses the custom cursor
        if (tool !== 'pen') {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [tool]);

    // Canvas Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#ef4444'; // Red pen
            ctx.lineWidth = 4;
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const startDrawing = (e: React.MouseEvent) => {
        if (tool !== 'pen') return;
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.clientX, e.clientY);
        }
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || tool !== 'pen') return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Eraser (Clear All for now for simplicity, or localized eraser?)
    // Simpler: Eraser just resets the canvas.
    useEffect(() => {
        if (tool === 'eraser') {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [tool]);

    if (!isActive) return null;

    return (
        <div
            ref={containerRef}
            className={`fixed inset-0 z-[100000] pointer-events-none ${tool === 'pen' ? 'pointer-events-auto cursor-crosshair' : ''}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        >
            {/* Drawing Canvas - pointer-events only when pen is active */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full ${tool !== 'pen' ? 'pointer-events-none' : ''}`}
            />

            {/* Custom Cursor (Ball) for all tools except Pen (which has browser cursor) */}
            {tool !== 'pen' && (
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
                        // Initial position off-screen or handled by first move
                        transform: 'translate(-50%, -50%)',
                        zIndex: 100002,
                        willChange: 'transform' // Hint to browser to optimize layering
                    }}
                />
            )}
        </div>
    );
};
