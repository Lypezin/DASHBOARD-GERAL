import { useState, useCallback, useEffect } from 'react';
import { MediaSlideData } from '@/types/presentation';
import { readJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

interface UseMediaSlidesProps {
    storageKey: string;
    isLoaded: boolean;
}

export function useMediaSlides({ storageKey, isLoaded }: UseMediaSlidesProps) {
    const [mediaSlides, setMediaSlides] = useState<MediaSlideData[]>([]);

    useEffect(() => {
        setMediaSlides(readJsonStorage<MediaSlideData[]>(window.localStorage, storageKey, []));
    }, [storageKey]);

    useEffect(() => {
        if (isLoaded) {
            writeJsonStorage(window.localStorage, storageKey, mediaSlides);
        }
    }, [mediaSlides, isLoaded, storageKey]);

    const handleUpdateMediaSlide = useCallback((id: string, updates: Partial<MediaSlideData>) => {
        setMediaSlides(prev => prev.map(slide => slide.id === id ? { ...slide, ...updates } : slide));
    }, []);

    const handleAddMediaSlide = useCallback(() => {
        const id = Math.random().toString(36).substr(2, 9);
        const newSlide: MediaSlideData = {
            id,
            title: 'Novo Slide',
            elements: []
        };
        setMediaSlides(prev => [...prev, newSlide]);
        return id;
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
