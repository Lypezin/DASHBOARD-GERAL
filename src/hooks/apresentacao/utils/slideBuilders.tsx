import React from 'react';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { chunkArray } from '@/utils/apresentacao/processors/common';
import { generateSmartInsights } from '@/utils/apresentacao/smartInsights';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideResumoIA from '@/components/apresentacao/slides/SlideResumoIA';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideRanking from '@/components/apresentacao/slides/SlideRanking';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';
import SlideDemanda from '@/components/apresentacao/slides/SlideDemandaRejeicoes';

// Constants
const SUB_PRACAS_PER_PAGE = 2;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 3;

// Interface for the slide config return type
export interface SlideConfig {
    key: string;
    render: (visible: boolean) => React.ReactNode;
}

export const buildSlideCapa = (
    visible: boolean,
    props: {
        pracaSelecionada: string | null;
        numeroSemana1: string;
        numeroSemana2: string;
        periodoSemana1: string;
        periodoSemana2: string;
    }
): SlideConfig | null => {
    if (!visible) return null;
    return {
        key: 'capa',
        render: (isVisible) => (
            <SlideCapa
                isVisible={isVisible}
                {...props}
            />
        ),
    };
};

export const buildSlideResumoIA = (
    visible: boolean,
    dadosProcessados: DadosProcessados
): SlideConfig | null => {
    if (!visible) return null;
    const insights = generateSmartInsights(dadosProcessados);
    return {
        key: 'resumo-ia',
        render: (isVisible) => <SlideResumoIA isVisible={isVisible} insights={insights} />
    };
};

export const buildSlideAderenciaGeral = (
    visible: boolean,
    dadosProcessados: DadosProcessados
): SlideConfig | null => {
    if (!visible) return null;
    const { resumoSemana1, resumoSemana2, variacaoResumo } = dadosProcessados;
    return {
        key: 'aderencia-geral',
        render: (isVisible) => (
            <SlideAderenciaGeral
                isVisible={isVisible}
                semana1={resumoSemana1}
                semana2={resumoSemana2}
                variacao={variacaoResumo}
            />
        ),
    };
};

export const buildSlideRanking = (
    visible: boolean,
    subPracasComparativo: any[]
): SlideConfig | null => {
    if (!visible) return null;
    const rankingItems = subPracasComparativo.map(item => ({
        nome: item.nome,
        aderencia: item.semana2.aderencia,
        horasEntregues: item.semana2.horasEntregues
    }));

    return {
        key: 'ranking',
        render: (isVisible) => <SlideRanking isVisible={isVisible} itens={rankingItems} />
    };
};

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

export const buildSlideAderenciaDiaria = (
    visible: boolean,
    props: {
        numeroSemana1: string;
        numeroSemana2: string;
        semana1Dias: any[];
        semana2Dias: any[];
    }
): SlideConfig | null => {
    if (!visible) return null;
    return {
        key: 'aderencia-diaria',
        render: (isVisible) => (
            <SlideAderenciaDiaria
                isVisible={isVisible}
                {...props}
            />
        ),
    };
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

export const buildSlideDemanda = (
    visible: boolean,
    demandaItens: any[],
    props: { numeroSemana1: string; numeroSemana2: string }
): SlideConfig | null => {
    if (!visible) return null;
    return {
        key: 'demanda',
        render: (isVisible) => (
            <SlideDemanda
                isVisible={isVisible}
                itens={demandaItens}
                numeroSemana1={props.numeroSemana1}
                numeroSemana2={props.numeroSemana2}
            />
        )
    };
};
