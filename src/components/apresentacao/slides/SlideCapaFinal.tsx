
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
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/10" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 md:px-8 lg:px-16">

                <div className="mb-12">
                    <div className="w-24 h-1.5 bg-blue-400 rounded-full mx-auto" />
                </div>

                <h1 className="text-7xl font-black text-white tracking-wider text-center mb-6 leading-tight drop-shadow-2xl">
                    OBRIGADO
                </h1>

                <p className="text-white/60 text-xl font-medium tracking-[0.2em] uppercase text-center max-w-2xl leading-relaxed">
                    Até a próxima semana
                </p>

                {/* Footer accent */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                    {/* Optional Logo footer */}
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

export default SlideCapaFinal;
