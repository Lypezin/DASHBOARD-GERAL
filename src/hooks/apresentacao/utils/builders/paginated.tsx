import React from 'react';
import { SlideConfig } from './types';
import { chunkArray } from '@/utils/apresentacao/processors/common';
import SlideSubPracas, { SubPracaComparativo } from '@/components/apresentacao/slides/SlideSubPracas';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';
import SlideDemandaOrigem from '@/components/apresentacao/slides/SlideDemandaOrigem';
import { DemandaOrigemItem } from '@/utils/apresentacao/processors/demandaOrigem';
import SlideResumoOrigens from '@/components/apresentacao/slides/SlideResumoOrigens';
import SlideResumoSubPracas from '@/components/apresentacao/slides/SlideResumoSubPracas';
import { OrigemProcessada } from '@/utils/apresentacao/processors/origens';

// Constants
const SUB_PRACAS_PER_PAGE = 3;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 3;

export const buildSlidesSubPracas = (visible: boolean, subPracasComparativo: any[], props: { numeroSemana1: string; numeroSemana2: string }): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
    subPracasPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `sub-pracas-${indice}`,
            render: (v) => <SlideSubPracas isVisible={v} numeroSemana1={props.numeroSemana1} numeroSemana2={props.numeroSemana2} paginaAtual={indice + 1} totalPaginas={subPracasPaginas.length} itens={pagina} />,
        });
    });
    return slides;
};

export const buildSlidesTurnos = (visible: boolean, turnosComparativo: any[], props: { numeroSemana1: string; numeroSemana2: string }): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
    turnosPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `turnos-${indice}`,
            render: (v) => <SlideTurnos isVisible={v} numeroSemana1={props.numeroSemana1} numeroSemana2={props.numeroSemana2} paginaAtual={indice + 1} totalPaginas={turnosPaginas.length} itens={pagina} />,
        });
    });
    return slides;
};

export const buildSlidesOrigem = (visible: boolean, origensComparativo: any[], props: { numeroSemana1: string; numeroSemana2: string }): SlideConfig[] => {
    if (!visible) return [];
    const slides: SlideConfig[] = [];
    const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
    origensPaginas.forEach((pagina, indice) => {
        slides.push({
            key: `origens-${indice}`,
            render: (v) => <SlideOrigem isVisible={v} numeroSemana1={props.numeroSemana1} numeroSemana2={props.numeroSemana2} paginaAtual={indice + 1} totalPaginas={origensPaginas.length} itens={pagina} />,
        });
    });
    return slides;
};

const DEMANDA_ORIGEM_PER_PAGE = 1;

export const buildSlidesDemandaOrigem = (visible: boolean, demandaOrigemItens: DemandaOrigemItem[], props: { numeroSemana1: string; numeroSemana2: string }): SlideConfig[] => {
    if (!visible || demandaOrigemItens.length === 0) return [];
    const slides: SlideConfig[] = [];
    const paginas = chunkArray(demandaOrigemItens, DEMANDA_ORIGEM_PER_PAGE);
    paginas.forEach((pagina, indice) => {
        slides.push({
            key: `demanda-origem-${indice}`,
            render: (v) => <SlideDemandaOrigem isVisible={v} numeroSemana1={props.numeroSemana1} numeroSemana2={props.numeroSemana2} paginaAtual={indice + 1} totalPaginas={paginas.length} itens={pagina} />,
        });
    });
    return slides;
};

const RESUMO_PER_PAGE = 12;

export const buildSlidesResumoOrigens = (
    visible: boolean,
    origensComparativo: OrigemProcessada[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig[] => {
    if (!visible || !origensComparativo || origensComparativo.length === 0) return [];
    const slides: SlideConfig[] = [];
    const paginas = chunkArray(origensComparativo, RESUMO_PER_PAGE);
    paginas.forEach((pagina, indice) => {
        slides.push({
            key: `resumo-origens-${indice}`,
            render: (v) => (
                <SlideResumoOrigens
                    isVisible={v}
                    numeroSemana1={props.numeroSemana1}
                    numeroSemana2={props.numeroSemana2}
                    paginaAtual={indice + 1}
                    totalPaginas={paginas.length}
                    itens={pagina}
                />
            ),
        });
    });
    return slides;
};

export const buildSlidesResumoSubPracas = (
    visible: boolean,
    subPracasComparativo: SubPracaComparativo[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig[] => {
    if (!visible || !subPracasComparativo || subPracasComparativo.length === 0) return [];
    const slides: SlideConfig[] = [];
    const paginas = chunkArray(subPracasComparativo, RESUMO_PER_PAGE);
    paginas.forEach((pagina, indice) => {
        slides.push({
            key: `resumo-sub-pracas-${indice}`,
            render: (v) => (
                <SlideResumoSubPracas
                    isVisible={v}
                    numeroSemana1={props.numeroSemana1}
                    numeroSemana2={props.numeroSemana2}
                    paginaAtual={indice + 1}
                    totalPaginas={paginas.length}
                    itens={pagina}
                />
            ),
        });
    });
    return slides;
};
