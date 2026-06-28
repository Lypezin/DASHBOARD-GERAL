import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { readJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import { useMediaSlides } from './useMediaSlides';

interface UseApresentacaoControllerProps {
    praca: string | null;
    ano: number | undefined;
    semanas: string[];
}

const DEFAULT_VISIBLE_SECTIONS = {
    capa: true,
    'resumo-ia': false,
    'aderencia-geral': true,
    ranking: false,
    'sub-pracas': true,
    'aderencia-diaria': true,
    utr: true,
    turnos: true,
    'media-origens': true,
    origens: true,
    'demanda-origem': true,
    demanda: true,
    entregadores: true,
    'capa-final': true,
};

type VisibleSections = typeof DEFAULT_VISIBLE_SECTIONS;

export function useApresentacaoController({ praca, ano, semanas }: UseApresentacaoControllerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const SECTIONS_VERSION = 'v3';
    const getStorageKey = (type: 'slides' | 'sections') => {
        const pracaKey = praca ? praca.replace(/\s+/g, '_').toLowerCase() : 'geral';
        const sortedWeeks = [...semanas].sort((a, b) => a.localeCompare(b));
        const strOpts = `${ano || new Date().getFullYear()}_${pracaKey}_${sortedWeeks.join('-')}`;
        return `dashboard_presentation_${type}_${strOpts}${type === 'sections' ? `_${SECTIONS_VERSION}` : '_v3'}`;
    };

    const [currentSlide, setCurrentSlide] = useState(0);
    const [viewMode, setViewMode] = useState<'preview' | 'web_presentation'>('preview');
    const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
    const [orderedPresentationSlides, setOrderedPresentationSlides] = useState<Array<{ key: string; render: (visible: boolean) => React.ReactNode }>>([]);
    const [loadedKey, setLoadedKey] = useState<string>('');

    const [visibleSections, setVisibleSections] = useState<VisibleSections>(DEFAULT_VISIBLE_SECTIONS);

    const sectionsKey = getStorageKey('sections');
    const slidesKey = getStorageKey('slides');

    useEffect(() => {
        const savedSections = readJsonStorage<Partial<VisibleSections>>(window.localStorage, sectionsKey, {});
        setVisibleSections({ ...DEFAULT_VISIBLE_SECTIONS, ...savedSections });
        setLoadedKey(sectionsKey);
    }, [sectionsKey]);

    useEffect(() => {
        if (loadedKey === sectionsKey) {
            writeJsonStorage(window.localStorage, sectionsKey, visibleSections);
        }
    }, [visibleSections, sectionsKey, loadedKey]);

    const mediaSlidesHook = useMediaSlides({ storageKey: slidesKey });

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
