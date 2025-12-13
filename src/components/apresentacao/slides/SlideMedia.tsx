import React from 'react';
import { MediaSlideData } from '@/types/presentation';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../constants';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, slideData, index }) => {
    return (
        <div
            className={`absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
        >
            <div
                className="relative transition-transform duration-500 ease-out flex items-center justify-center h-full w-full"
                style={{
                    transform: `scale(${slideData.scale})`,
                }}
            >
                <img
                    src={slideData.url}
                    className="max-w-[90%] max-h-[90%] object-contain drop-shadow-2xl"
                    alt={`Anexo ${index + 1}`}
                />
            </div>

            {slideData.text && (
                <div
                    className={`absolute left-0 right-0 p-8 text-white text-center font-semibold text-shadow-lg z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300
                    ${slideData.textPosition === 'top' ? 'top-0 pt-16 bg-gradient-to-b from-black/80 to-transparent' :
                            slideData.textPosition === 'center' ? 'top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm py-12' :
                                'bottom-0 pb-16 bg-gradient-to-t from-black/80 to-transparent'
                        }
                `}
                >
                    <p className="text-4xl leading-relaxed drop-shadow-md max-w-5xl mx-auto">
                        {slideData.text}
                    </p>
                </div>
            )}

            <div className="absolute bottom-6 left-6 text-white/30 text-sm font-medium z-10">
                Anexo {index + 1}
            </div>
        </div>
    );
};

export default SlideMedia;
