import { useState, useCallback, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { MediaSlideData } from '@/types/presentation';

interface UseMediaSlidesProps {
    storageKey: string;
    isLoaded: boolean;
}

export function useMediaSlides({ storageKey, isLoaded }: UseMediaSlidesProps) {
    const [mediaSlides, setMediaSlides] = useState<MediaSlideData[]>([]);

    useEffect(() => {
        const savedSlides = localStorage.getItem(storageKey);
        if (savedSlides) {
            try {
                setMediaSlides(JSON.parse(savedSlides));
            } catch (e) {
                safeLog.error('Error parsing saved slides:', e);
                setMediaSlides([]);
            }
        } else {
            setMediaSlides([]);
        }
    }, [storageKey]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(storageKey, JSON.stringify(mediaSlides));
        }
    }, [mediaSlides, isLoaded, storageKey]);

    const handleUpdateMediaSlide = useCallback((id: string, updates: Partial<MediaSlideData>) => {
        setMediaSlides(prev => prev.map(slide => slide.id === id ? { ...slide, ...updates } : slide));
    }, []);

    const handleAddMediaSlide = useCallback(() => {
        const newSlide: MediaSlideData = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Novo Slide',
            elements: []
        };
        setMediaSlides(prev => [...prev, newSlide]);
    }, []);

    const handleDeleteMediaSlide = useCallback((id: string) => {
        setMediaSlides(prev => prev.filter(s => s.id !== id));
    }, []);

    return {
        mediaSlides,
        setMediaSlides,
        handleUpdateMediaSlide,
        handleAddMediaSlide,
        handleDeleteMediaSlide
    };
}
