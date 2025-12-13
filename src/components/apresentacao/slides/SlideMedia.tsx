import React from 'react';
import { MediaSlideData } from '@/types/presentation';
import SlideWrapper from '../SlideWrapper';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, slideData, index }) => {
    return (
        <SlideWrapper
            isVisible={isVisible}
            style={{
                padding: 0,
                backgroundColor: '#ffffff',
                overflow: 'hidden',
            }}
        >
            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div
                    className="relative transition-transform duration-500 ease-out flex items-center justify-center"
                    style={{
                        transform: `scale(${slideData.scale})`,
                    }}
                >
                    <img
                        src={slideData.url}
                        className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-lg"
                        alt={`Anexo ${index + 1}`}
                    />
                </div>
            </div>

            {/* Text Overlay */}
            {slideData.text && (
                <div
                    className={`absolute left-0 right-0 p-8 text-slate-800 text-center font-semibold z-20 pointer-events-none
                    ${slideData.textPosition === 'top' ? 'top-0 pt-16 bg-gradient-to-b from-white/90 to-transparent' :
                            slideData.textPosition === 'center' ? 'top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm py-12' :
                                'bottom-0 pb-16 bg-gradient-to-t from-white/90 to-transparent'
                        }
                `}
                >
                    <p className="text-3xl leading-relaxed max-w-5xl mx-auto">
                        {slideData.text}
                    </p>
                </div>
            )}

            {/* Footer Label */}
            <div className="absolute bottom-6 left-6 text-slate-400 text-sm font-medium z-10">
                Anexo {index + 1}
            </div>
        </SlideWrapper>
    );
};

export default SlideMedia;
