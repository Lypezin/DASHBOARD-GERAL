import React, { forwardRef } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../constants';

interface PresentationCaptureLayerProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    capturingIndex: number | null;
}

export const PresentationCaptureLayer = forwardRef<HTMLDivElement, PresentationCaptureLayerProps>(
    ({ slides, capturingIndex }, ref) => {
        return (
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: 0,
                    width: SLIDE_WIDTH,
                    height: SLIDE_HEIGHT,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
                aria-hidden="true"
            >
                {capturingIndex !== null && slides[capturingIndex] && (
                    <div
                        key={`capture-${slides[capturingIndex].key}`}
                        className="slide-for-capture"
                        style={{
                            width: SLIDE_WIDTH,
                            height: SLIDE_HEIGHT,
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                        }}
                    >
                        {slides[capturingIndex].render(true)}
                    </div>
                )}
            </div>
        );
    }
);

PresentationCaptureLayer.displayName = 'PresentationCaptureLayer';
