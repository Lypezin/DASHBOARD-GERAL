'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import { MarketingCityData, MarketingCostsComparison } from '@/types';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface MarketingReportSlidesProps {
    citiesData: MarketingCityData[];
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
    weeklyData: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>;
    weeklyDataByCity: Array<{ cidade: string; data: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }> }>;
    costsComparison: MarketingCostsComparison;
    titulo: string;
    periodoFormatado: string;
}

import { MarketingExitButton } from './MarketingExitButton';
import { WeeklySlidesSection } from './WeeklySlidesSection';
import { CostsSlidesSection } from './CostsSlidesSection';
import { MarketingSlideFrame } from './MarketingSlideFrame';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/components/apresentacao/constants';

const PresentationSpotlight = dynamic(
    () => import('@/components/apresentacao/components/PresentationSpotlight').then((mod) => mod.PresentationSpotlight),
    { ssr: false }
);
const MarketingFloatingNav = dynamic(
    () => import('@/components/apresentacao/components/MarketingFloatingNav').then((mod) => mod.MarketingFloatingNav),
    { ssr: false }
);

export const MarketingReportSlides: React.FC<MarketingReportSlidesProps> = ({
    citiesData,
    evolutionData,
    weeklyData,
    weeklyDataByCity,
    costsComparison,
    titulo: _titulo,
    periodoFormatado
}) => {
    const router = useRouter();
    const { theme } = useTheme();
    const [scale, setScale] = useState(1);
    const [isPrintReady, setIsPrintReady] = useState(false);

    useEffect(() => {
        let frameId: number | null = null;
        const updateScale = () => {
            frameId = null;
            const availableWidth = Math.max(240, window.innerWidth - 32);
            const availableHeight = Math.max(240, window.innerHeight - 32);
            setScale(Math.min(
                1,
                availableWidth / SLIDE_WIDTH,
                availableHeight / SLIDE_HEIGHT
            ));
        };
        const scheduleUpdate = () => {
            if (frameId !== null) return;
            frameId = window.requestAnimationFrame(updateScale);
        };

        updateScale();
        window.addEventListener('resize', scheduleUpdate, { passive: true });
        return () => {
            window.removeEventListener('resize', scheduleUpdate);
            if (frameId !== null) window.cancelAnimationFrame(frameId);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const markReady = async () => {
            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise<void>((resolve) => {
                const fallbackId = window.setTimeout(resolve, 1200);
                window.addEventListener('marketing-chart-ready', () => {
                    window.clearTimeout(fallbackId);
                    resolve();
                }, { once: true });
            });
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
            if (!cancelled) setIsPrintReady(true);
        };
        void markReady();
        return () => { cancelled = true; };
    }, []);
    
    const onExit = () => router.push('/?tab=marketing');

    return (
        <div
            data-print-ready={isPrintReady ? 'true' : 'false'}
            className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 animate-fade-in ${
                theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'
            }`}
            style={{
                '--marketing-slide-scale': scale,
                '--marketing-slide-width': `${SLIDE_WIDTH * scale}px`,
                '--marketing-slide-height': `${SLIDE_HEIGHT * scale}px`,
            } as React.CSSProperties}
        >
            <PresentationSpotlight />
            <MarketingFloatingNav />
            <MarketingExitButton onExit={onExit} theme={theme} />

            <MarketingSlideFrame id="top" className="animate-slide-up">
                <SlideCapaMarketing isVisible titulo="Cadastros Marketing" periodo={periodoFormatado} subtitulo="Relatório de Resultados" />
            </MarketingSlideFrame>

            <MarketingSlideFrame id="unidades" className="animate-slide-up">
                <SlideEvolucaoResumoMarketing isVisible={true} evolutionData={evolutionData} citiesData={citiesData} />
            </MarketingSlideFrame>

            <div id="semanal">
                <WeeklySlidesSection weeklyData={weeklyData} weeklyDataByCity={weeklyDataByCity} />
            </div>

            <div id="custos">
                <CostsSlidesSection costsComparison={costsComparison} />
            </div>
        </div>
    );
};
