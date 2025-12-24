
import { useState, useCallback } from 'react';
import { MediaSlideData } from '@/types/presentation';

export function useApresentacaoController() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [viewMode, setViewMode] = useState<'preview' | 'web_presentation'>('preview');

    const [visibleSections, setVisibleSections] = useState({
        capa: true,
        'aderencia-geral': true,
        'sub-pracas': true,
        'aderencia-diaria': true,
        turnos: true,
        origens: true,
        demanda: true,
        'capa-final': true,
    });

    const [mediaSlides, setMediaSlides] = useState<MediaSlideData[]>([]);
    const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
    const [orderedPresentationSlides, setOrderedPresentationSlides] = useState<Array<{ key: string; render: (visible: boolean) => React.ReactNode }>>([]);

    const handleUpdateMediaSlide = useCallback((id: string, updates: Partial<MediaSlideData>) => {
        setMediaSlides(prev => prev.map(slide =>
            slide.id === id ? { ...slide, ...updates } : slide
        ));
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

    const toggleSection = useCallback((section: string) => {
        setVisibleSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
    }, []);

    return {
        state: {
            currentSlide,
            viewMode,
            visibleSections,
            mediaSlides,
            isMediaManagerOpen,
            orderedPresentationSlides
        },
        actions: {
            setCurrentSlide,
            setViewMode,
            setVisibleSections,
            setMediaSlides,
            setIsMediaManagerOpen,
            setOrderedPresentationSlides,
            handleUpdateMediaSlide,
            handleAddMediaSlide,
            handleDeleteMediaSlide,
            toggleSection
        }
    };
}
