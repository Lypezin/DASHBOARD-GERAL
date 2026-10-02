
import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface SlideCapaFinalProps {
    isVisible: boolean;
}

const SlideCapaFinal: React.FC<SlideCapaFinalProps> = ({ isVisible }) => {
    return (
        <SlideWrapper
            isVisible={isVisible}
            style={{
                padding: 0,
                background: 'hsl(var(--primary))',
                overflow: 'hidden',
            }}
        >
            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 md:px-8 lg:px-16">

                <div className="mb-12 text-center text-white">
                    <p className="font-serif text-4xl font-semibold">GO Itaim</p>
                    <div className="mt-4 h-px w-32 bg-white/50" />
                </div>

                <h1 className="text-7xl font-semibold text-white tracking-tight text-center mb-6 leading-tight">
                    OBRIGADO
                </h1>

                <p className="text-white/75 text-xl font-medium tracking-[0.16em] uppercase text-center max-w-2xl leading-relaxed">
                    Até a próxima semana
                </p>

                {/* Footer accent */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                    <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">Dashboard Geral · Operações</span>
                </div>
            </div>
        </SlideWrapper>
    );
};

export default SlideCapaFinal;
