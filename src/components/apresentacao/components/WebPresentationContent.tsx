
import React from 'react';

interface WebPresentationContentProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const WebPresentationContent: React.FC<WebPresentationContentProps> = ({
    slides,
    containerRef,
}) => {
    return (
        <div className={`presentation-mode-container fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[99999] overflow-y-auto overflow-x-hidden`}>
            <div className="min-h-screen py-10 flex flex-col items-center w-full">
                <div
                    ref={containerRef}
                    className="flex flex-col items-center w-full max-w-[1920px] px-4 md:px-8 lg:px-12"
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.key}
                            className="w-full flex justify-center"
                        >
                            {slide.render(true)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-6 right-6 z-[99995] pointer-events-none opacity-50 mix-blend-difference text-white text-xs font-mono">
                Pressione ESC para sair
            </div>
        </div>
    );
};
