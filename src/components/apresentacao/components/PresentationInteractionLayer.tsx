
import React, { useRef } from 'react';
import { usePresentationCanvas } from '@/hooks/apresentacao/usePresentationCanvas';
import { PresentationCursor } from './PresentationCursor';

export type ToolType = 'cursor' | 'laser' | 'pen' | 'eraser';

interface PresentationInteractionLayerProps {
    tool: ToolType;
    isActive: boolean;
}

export const PresentationInteractionLayer: React.FC<PresentationInteractionLayerProps> = ({ tool, isActive }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { canvasRef, startDrawing, draw, stopDrawing } = usePresentationCanvas(tool);

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
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full ${tool !== 'pen' ? 'pointer-events-none' : ''}`}
            />

            <PresentationCursor tool={tool} />
        </div>
    );
};
