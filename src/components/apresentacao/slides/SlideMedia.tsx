import React from 'react';
import { MediaSlideData } from '@/types/presentation';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../constants';

interface SlideMediaProps {
    isVisible: boolean;
    slideData: MediaSlideData;
    index: number;
}


{/* Caption / Label - Fade in */ }
<div className={`absolute bottom-8 left-8 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white transition-opacity duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
    <span className="text-sm font-medium uppercase tracking-widest">Anexo {index + 1}</span>
</div>
            </div >
        </SlideWrapper >
    );
};

export default SlideMedia;
