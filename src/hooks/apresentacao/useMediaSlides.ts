import { useState, useCallback, useEffect } from 'react';
import { MediaSlideData } from '@/types/presentation';
import { readJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

interface UseMediaSlidesProps {
    storageKey: string;
}

export function useMediaSlides({ storageKey }: UseMediaSlidesProps) {
    const [mediaSlides, setMediaSlides] = useState<MediaSlideData[]>([]);
    const [loadedKey, setLoadedKey] = useState<string>('');

    useEffect(() => {
        const data = readJsonStorage<MediaSlideData[]>(window.localStorage, storageKey, []);
        setMediaSlides(data);
        setLoadedKey(storageKey);
    }, [storageKey]);

    useEffect(() => {
        if (loadedKey === storageKey) {
            writeJsonStorage(window.localStorage, storageKey, mediaSlides);
        }
    }, [mediaSlides, storageKey, loadedKey]);

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
