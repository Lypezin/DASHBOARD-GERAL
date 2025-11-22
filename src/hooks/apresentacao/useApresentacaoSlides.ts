import { useMemo } from 'react';
import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { DashboardResumoData } from '@/types';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { chunkArray } from '@/utils/apresentacao/dataProcessor';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideDemandaRejeicoes from '@/components/apresentacao/slides/SlideDemandaRejeicoes';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';

const SUB_PRACAS_PER_PAGE = 2;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 4;

export const useApresentacaoSlides = (
  dadosProcessados: DadosProcessados | null,
  dadosComparacao: DashboardResumoData[],
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string,
  pracaSelecionada: string | null
) => {
  const slides = useMemo(() => {
    if (!dadosProcessados) {
      safeLog.warn('ApresentacaoView: dados insuficientes para gerar slides', {
        total: dadosComparacao?.length || 0,
        hasProcessed: !!dadosProcessados,
      });
      return [] as Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    }

    const slidesConfig: Array<{ key: string; render: (visible: boolean) => React.ReactNode }> = [];
    const { resumoSemana1, resumoSemana2, variacaoResumo, subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens } = dadosProcessados;

    slidesConfig.push({
      key: 'capa',
      render: (visible) => (
        <SlideCapa
          isVisible={visible}
          pracaSelecionada={pracaSelecionada}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          periodoSemana1={periodoSemana1}
          periodoSemana2={periodoSemana2}
        />
      ),
    });

    slidesConfig.push({
      key: 'aderencia-geral',
      render: (visible) => (
        <SlideAderenciaGeral
          isVisible={visible}
          semana1={resumoSemana1}
          semana2={resumoSemana2}
          variacao={variacaoResumo}
        />
      ),
    });

    const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
    subPracasPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `sub-pracas-${indice}`,
        render: (visible) => (
          <SlideSubPracas
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={subPracasPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    slidesConfig.push({
      key: 'aderencia-diaria',
      render: (visible) => (
        <SlideAderenciaDiaria
          isVisible={visible}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          semana1Dias={semana1Dias}
          semana2Dias={semana2Dias}
        />
      ),
    });

    const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
    turnosPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `turnos-${indice}`,
        render: (visible) => (
          <SlideTurnos
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={turnosPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
    origensPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `origens-${indice}`,
        render: (visible) => (
          <SlideOrigem
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={origensPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    slidesConfig.push({
      key: 'demanda',
      render: (visible) => (
        <SlideDemandaRejeicoes
          isVisible={visible}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          itens={demandaItens}
        />
      ),
    });

    return slidesConfig;
  }, [dadosProcessados, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2, pracaSelecionada, dadosComparacao?.length]);

  return slides;
};

