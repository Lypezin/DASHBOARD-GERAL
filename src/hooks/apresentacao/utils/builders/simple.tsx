import React from 'react';
import { SlideConfig } from './types';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { generateSmartInsights } from '@/utils/apresentacao/smartInsights';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideResumoIA from '@/components/apresentacao/slides/SlideResumoIA';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideRanking from '@/components/apresentacao/slides/SlideRanking';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideDemanda from '@/components/apresentacao/slides/SlideDemandaRejeicoes';

export const buildSlideCapa = (visible: boolean, props: { pracaSelecionada: string | null; numeroSemana1: string; numeroSemana2: string; periodoSemana1: string; periodoSemana2: string; }): SlideConfig | null => {
    if (!visible) return null;
    return { key: 'capa', render: (isVisible) => <SlideCapa isVisible={isVisible} {...props} /> };
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

export const buildSlideAderenciaGeral = (visible: boolean, dadosProcessados: DadosProcessados): SlideConfig | null => {
    if (!visible) return null;
    const { resumoSemana1, resumoSemana2, variacaoResumo } = dadosProcessados;
    return { key: 'aderencia-geral', render: (v) => <SlideAderenciaGeral isVisible={v} semana1={resumoSemana1} semana2={resumoSemana2} variacao={variacaoResumo} /> };
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

export const buildSlideAderenciaDiaria = (visible: boolean, props: { numeroSemana1: string; numeroSemana2: string; semana1Dias: any[]; semana2Dias: any[]; }): SlideConfig | null => {
    if (!visible) return null;
    return { key: 'aderencia-diaria', render: (v) => <SlideAderenciaDiaria isVisible={v} {...props} /> };
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
