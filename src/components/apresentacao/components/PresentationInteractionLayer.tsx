import React, { useEffect, useRef, useState } from 'react';

export type ToolType = 'cursor' | 'laser' | 'pen' | 'eraser';

interface PresentationInteractionLayerProps {
    tool: ToolType;
    isActive: boolean;
}

export const PresentationInteractionLayer: React.FC<PresentationInteractionLayerProps> = ({ tool, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);

    // Laser Pointer movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
            {/* Drawing Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Custom Cursor (Ball) for all tools except Pen (which has browser cursor) */}
            {tool !== 'pen' && (
                <div
                    className={`fixed w-4 h-4 rounded-full pointer-events-none transition-transform duration-75 mix-blend-screen
                    ${tool === 'laser'
                            ? 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                            : 'bg-blue-400/80 border-2 border-white shadow-sm' // Default cursor style: Blueish ball
                        }`}
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 100002 // Ensure it's on top
                    }}
                />
            )}
        </div>
    );
};
