import React from 'react';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { MediaSlideData } from '@/types/presentation';
import SlideMedia from '@/components/apresentacao/slides/SlideMedia';
import SlideUTR from '@/components/apresentacao/slides/SlideUTR';
import SlideCapaFinal from '@/components/apresentacao/slides/SlideCapaFinal';
import {
    buildSlideCapa, buildSlideResumoIA, buildSlideAderenciaGeral, buildSlideRanking,
    buildSlidesSubPracas, buildSlideAderenciaDiaria, buildSlidesTurnos, buildSlidesOrigem,
    buildSlideDemanda, buildSlidesDemandaOrigem, SlideConfig
} from './slideBuilders';

export function buildAllSlides(
    dadosProcessados: DadosProcessados,
    utrComparacao: any[],
    numeroSemana1: string,
    numeroSemana2: string,
    periodoSemana1: string,
    periodoSemana2: string,
    pracaSelecionada: string | null,
    visibleSections: Record<string, boolean>,
    mediaSlides: MediaSlideData[],
    onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void
): SlideConfig[] {
    const slidesConfig: SlideConfig[] = [];
    const { subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens, demandaOrigemItens } = dadosProcessados;

    const capa = buildSlideCapa(visibleSections.capa, { pracaSelecionada, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 });
    if (capa) slidesConfig.push(capa);

    const resumoIA = buildSlideResumoIA(visibleSections['resumo-ia'], dadosProcessados);
    if (resumoIA) slidesConfig.push(resumoIA);

    const aderenciaGeral = buildSlideAderenciaGeral(visibleSections['aderencia-geral'], dadosProcessados);
    if (aderenciaGeral) slidesConfig.push(aderenciaGeral);

    const ranking = buildSlideRanking(visibleSections['ranking'], subPracasComparativo);
    if (ranking) slidesConfig.push(ranking);

    slidesConfig.push(...buildSlidesSubPracas(visibleSections['sub-pracas'], subPracasComparativo, { numeroSemana1, numeroSemana2 }));

    const aderenciaDiaria = buildSlideAderenciaDiaria(visibleSections['aderencia-diaria'], { numeroSemana1, numeroSemana2, semana1Dias, semana2Dias });
    if (aderenciaDiaria) slidesConfig.push(aderenciaDiaria);

    if (visibleSections['utr'] !== false) {
        slidesConfig.push({ key: 'utr', render: (visible) => <SlideUTR isVisible={visible} numeroSemana1={numeroSemana1} numeroSemana2={numeroSemana2} utrComparacao={utrComparacao} /> });
    }

    slidesConfig.push(...buildSlidesTurnos(visibleSections.turnos, turnosComparativo, { numeroSemana1, numeroSemana2 }));
    slidesConfig.push(...buildSlidesOrigem(visibleSections.origens, origensComparativo, { numeroSemana1, numeroSemana2 }));

    const demanda = buildSlideDemanda(visibleSections.demanda, demandaItens, { numeroSemana1, numeroSemana2 });
    if (demanda) slidesConfig.push(demanda);

    slidesConfig.push(...buildSlidesDemandaOrigem(visibleSections['demanda-origem'], demandaOrigemItens ?? [], { numeroSemana1, numeroSemana2 }));

    mediaSlides.forEach((slideData, index) => {
        slidesConfig.push({ key: `media-${slideData.id}`, render: (visible) => <SlideMedia isVisible={visible} slideData={slideData} index={index} onUpdate={(updates) => onUpdateMediaSlide?.(slideData.id, updates)} /> });
    });

    if (visibleSections['capa-final']) {
        slidesConfig.push({ key: 'capa-final', render: (visible) => <SlideCapaFinal isVisible={visible} /> });
    }

    return slidesConfig;
}
