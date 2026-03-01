import { useState, useCallback, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMediaSlides } from './useMediaSlides';

interface UseApresentacaoControllerProps {
    praca: string | null;
    ano: number | undefined;
    semanas: string[];
}

export function useApresentacaoController({ praca, ano, semanas }: UseApresentacaoControllerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const SECTIONS_VERSION = 'v2';
    const getStorageKey = (type: 'slides' | 'sections') => {
        const pracaKey = praca ? praca.replace(/\s+/g, '_').toLowerCase() : 'geral';
        const strOpts = `${ano || new Date().getFullYear()}_${pracaKey}_${semanas.sort().join('-')}`;
        return `dashboard_presentation_${type}_${strOpts}${type === 'sections' ? `_${SECTIONS_VERSION}` : ''}`;
    };

    const getInitialViewMode = () => searchParams.get('comp_apres_mode') === 'web_presentation' ? 'web_presentation' : 'preview';

    const [currentSlide, setCurrentSlide] = useState(0);
    const [viewMode, setViewMode] = useState<'preview' | 'web_presentation'>(getInitialViewMode);
    const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
    const [orderedPresentationSlides, setOrderedPresentationSlides] = useState<Array<{ key: string; render: (visible: boolean) => React.ReactNode }>>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const [visibleSections, setVisibleSections] = useState({
        capa: true, 'resumo-ia': false, 'aderencia-geral': true, ranking: false, 'sub-pracas': true,
        'aderencia-diaria': true, utr: true, turnos: true, origens: true, 'demanda-origem': true, demanda: true, 'capa-final': true,
    });

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (viewMode === 'web_presentation') {
            if (params.get('comp_apres_mode') !== 'web_presentation') { params.set('comp_apres_mode', 'web_presentation'); changed = true; }
        } else if (params.has('comp_apres_mode')) { params.delete('comp_apres_mode'); changed = true; }

        if (changed) router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [viewMode, pathname, router, searchParams]);

    const sectionsKey = getStorageKey('sections');
    const slidesKey = getStorageKey('slides');

    useEffect(() => {
        const savedSections = localStorage.getItem(sectionsKey);
        if (savedSections) {
            try { setVisibleSections(prev => ({ ...prev, ...JSON.parse(savedSections) })); }
            catch (e) { safeLog.error('Error parsing saved sections:', e); }
        }
        setIsLoaded(true);
    }, [sectionsKey]);

    useEffect(() => {
        if (isLoaded) localStorage.setItem(sectionsKey, JSON.stringify(visibleSections));
    }, [visibleSections, isLoaded, sectionsKey]);

    const mediaSlidesHook = useMediaSlides({ storageKey: slidesKey, isLoaded });

    const toggleSection = useCallback((section: string) => {
        setVisibleSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
    }, []);

    return {
        state: { currentSlide, viewMode, visibleSections, mediaSlides: mediaSlidesHook.mediaSlides, isMediaManagerOpen, orderedPresentationSlides },
        actions: {
            setCurrentSlide, setViewMode, setVisibleSections, setMediaSlides: mediaSlidesHook.setMediaSlides, setIsMediaManagerOpen, setOrderedPresentationSlides,
            handleUpdateMediaSlide: mediaSlidesHook.handleUpdateMediaSlide, handleAddMediaSlide: mediaSlidesHook.handleAddMediaSlide, handleDeleteMediaSlide: mediaSlidesHook.handleDeleteMediaSlide, toggleSection
        }
    };
}
