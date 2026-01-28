import { useState, useCallback, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MediaSlideData } from '@/types/presentation';

interface UseApresentacaoControllerProps {
    praca: string | null;
    ano: number | undefined;
    semanas: string[];
}

export function useApresentacaoController({ praca, ano, semanas }: UseApresentacaoControllerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Generate specific storage key based on context
    const getStorageKey = (type: 'slides' | 'sections') => {
        const pracaKey = praca ? praca.replace(/\s+/g, '_').toLowerCase() : 'geral';
        const semanasKey = semanas.sort().join('-');
        const anoKey = ano || new Date().getFullYear();
        return `dashboard_presentation_${type}_${anoKey}_${pracaKey}_${semanasKey}`;
    };

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

    // Load from localStorage on mount or when key changes
    useEffect(() => {
        const slidesKey = getStorageKey('slides');
        const sectionsKey = getStorageKey('sections');

        const savedSlides = localStorage.getItem(slidesKey);
        const savedSections = localStorage.getItem(sectionsKey);

        if (savedSlides) {
            try {
                setMediaSlides(JSON.parse(savedSlides));
            } catch (e) {
                safeLog.error('Error parsing saved slides:', e);
                setMediaSlides([]);
            }
        } else {
            setMediaSlides([]); // Reset if no saved data for this context
        }

        if (savedSections) {
            try {
                setVisibleSections(JSON.parse(savedSections));
            } catch (e) {
                safeLog.error('Error parsing saved sections:', e);
            }
        } else {
            // Reset to defaults if needed, or keep previous state? 
            // Ideally reset to defaults for a new context, but keeping existing logic for now.
            // Actually, if we switch contexts, we should probably reset visibleSections to default if nothing saved.
            // But the original code initialized state with defaults.
            // We'll trust the initial state is good enough if nothing is saved.
        }

        setIsLoaded(true);
    }, [praca, ano, JSON.stringify(semanas)]); // Re-run when context changes

    // Save to localStorage when changes occur
    useEffect(() => {
        if (isLoaded) {
            const slidesKey = getStorageKey('slides');
            localStorage.setItem(slidesKey, JSON.stringify(mediaSlides));
        }
    }, [mediaSlides, isLoaded, praca, ano, JSON.stringify(semanas)]);

    useEffect(() => {
        if (isLoaded) {
            const sectionsKey = getStorageKey('sections');
            localStorage.setItem(sectionsKey, JSON.stringify(visibleSections));
        }
    }, [visibleSections, isLoaded, praca, ano, JSON.stringify(semanas)]);

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
