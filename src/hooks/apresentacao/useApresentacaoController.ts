import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MediaSlideData } from '@/types/presentation';

export function useApresentacaoController() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const getInitialViewMode = () => {
        return searchParams.get('comp_apres_mode') === 'web_presentation'
            ? 'web_presentation'
            : 'preview';
    };

    const [currentSlide, setCurrentSlide] = useState(0);
    const [viewMode, setViewMode] = useState<'preview' | 'web_presentation'>(getInitialViewMode);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (viewMode === 'web_presentation') {
            if (params.get('comp_apres_mode') !== 'web_presentation') {
                params.set('comp_apres_mode', 'web_presentation');
                changed = true;
            }
        } else if (params.has('comp_apres_mode')) {
            params.delete('comp_apres_mode');
            changed = true;
        }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [viewMode, pathname, router, searchParams]);

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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedSlides = localStorage.getItem('dashboard_presentation_slides');
        const savedSections = localStorage.getItem('dashboard_presentation_sections');

        if (savedSlides) {
            try {
                setMediaSlides(JSON.parse(savedSlides));
            } catch (e) {
                console.error('Error parsing saved slides:', e);
            }
        }

        if (savedSections) {
            try {
                setVisibleSections(JSON.parse(savedSections));
            } catch (e) {
                console.error('Error parsing saved sections:', e);
            }
        }

        setIsLoaded(true);
    }, []);

    // Save to localStorage when changes occur
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('dashboard_presentation_slides', JSON.stringify(mediaSlides));
        }
    }, [mediaSlides, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('dashboard_presentation_sections', JSON.stringify(visibleSections));
        }
    }, [visibleSections, isLoaded]);

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
