import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';

interface SlideMediaProps {
    isVisible: boolean;
    mediaUrl: string;
    index: number;
}

const SlideMedia: React.FC<SlideMediaProps> = ({ isVisible, mediaUrl, index }) => {
    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '0px' }}>
            {/* Optional Header - Overlay on top of image or completely hidden for immersion? 
                 Let's keep it clean: no header, just the image, unless user hovers? 
                 Actually, standard layout might be better. Let's maximize the image.
             */}

            <div className="relative w-full h-full flex items-center justify-center bg-black">
                {/* Image */}
                <img
                    src={mediaUrl}
                    alt={`Slide Anexo ${index + 1}`}
                    className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg transition-transform duration-700 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                />

                {/* Caption / Label - Fade in */}
                <div className={`absolute bottom-8 left-8 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white transition-opacity duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-sm font-medium uppercase tracking-widest">Anexo {index + 1}</span>
                </div>
            </div>
        </SlideWrapper>
    );
};

export default SlideMedia;
