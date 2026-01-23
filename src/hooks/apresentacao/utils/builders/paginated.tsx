import React from 'react';
import { SlideConfig } from './types';
import { chunkArray } from '@/utils/apresentacao/processors/common';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';

// Constants
const SUB_PRACAS_PER_PAGE = 3;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 3;

export const buildSlidesSubPracas = (
    visible: boolean,
    subPracasComparativo: any[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);

    subPracasPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `sub-pracas-${indice}`,
            render: (isVisible) => (
                <SlideSubPracas
                    isVisible={isVisible}
                    numeroSemana1={props.numeroSemana1}
                    numeroSemana2={props.numeroSemana2}
                    paginaAtual={indice + 1}
                    totalPaginas={subPracasPaginas.length}
                    itens={pagina}
                />
            ),
        });
    });
    return slides;
};

export const buildSlidesTurnos = (
    visible: boolean,
    turnosComparativo: any[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
    turnosPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `turnos-${indice}`,
            render: (isVisible) => (
                <SlideTurnos
                    isVisible={isVisible}
                    numeroSemana1={props.numeroSemana1}
                    numeroSemana2={props.numeroSemana2}
                    paginaAtual={indice + 1}
                    totalPaginas={turnosPaginas.length}
                    itens={pagina}
                />
            ),
        });
    });
    return slides;
};

export const buildSlidesOrigem = (
    visible: boolean,
    origensComparativo: any[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
    origensPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `origens-${indice}`,
            render: (isVisible) => (
                <SlideOrigem
                    isVisible={isVisible}
                    numeroSemana1={props.numeroSemana1}
                    numeroSemana2={props.numeroSemana2}
                    paginaAtual={indice + 1}
                    totalPaginas={origensPaginas.length}
                    itens={pagina}
                />
            ),
        });
    });
    return slides;
};
