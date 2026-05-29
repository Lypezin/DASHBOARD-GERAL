
import { useEffect, useRef, useState, useCallback } from 'react';
import { ToolType } from '@/components/apresentacao/components/PresentationInteractionLayer';

export function usePresentationCanvas(tool: ToolType) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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

    useEffect(() => {
        if (tool === 'eraser') {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [tool]);

    const startDrawing = useCallback((e: React.MouseEvent) => {
        if (tool !== 'pen') return;
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.clientX, e.clientY);
        }
    }, [tool]);

    const draw = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || tool !== 'pen') return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        }
    }, [isDrawing, tool]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    return {
        canvasRef,
        startDrawing,
        draw,
        stopDrawing
    };
}
