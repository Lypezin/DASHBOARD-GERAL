
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PresentationInteractionLayer, ToolType } from './components/PresentationInteractionLayer';
import { WebPresentationToolbar } from './components/WebPresentationToolbar';
import { WebPresentationContent } from './components/WebPresentationContent';

interface ApresentacaoWebModeProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    onClose: () => void;
}

export const ApresentacaoWebMode: React.FC<ApresentacaoWebModeProps> = ({
    slides,
    onClose,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [tool, setTool] = useState<ToolType>('laser');

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <>
            <PresentationInteractionLayer tool={tool} isActive={true} />

            <style>{`
                .presentation-mode-container, .presentation-mode-container * {
                    cursor: none !important;
                }
                .presentation-toolbar, .presentation-toolbar * {
                    cursor: auto !important;
                }
            `}</style>

            <WebPresentationToolbar
                tool={tool}
                setTool={setTool}
                onClose={onClose}
            />

            <WebPresentationContent
                slides={slides}
                containerRef={containerRef}
            />
        </>,
        document.body
    );
};
