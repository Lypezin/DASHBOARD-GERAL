import { useMemo } from 'react';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { DashboardResumoData } from '@/types/dashboard';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';
import SlideDemanda from '@/components/apresentacao/slides/SlideDemandaRejeicoes';
import SlideRanking from '@/components/apresentacao/slides/SlideRanking';
import SlideResumoIA from '@/components/apresentacao/slides/SlideResumoIA';
import SlideMedia from '@/components/apresentacao/slides/SlideMedia';
import { generateSmartInsights } from '@/utils/apresentacao/smartInsights';
import { chunkArray } from '@/utils/apresentacao/processors/common';

const SUB_PRACAS_PER_PAGE = 2;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 3;

export const useApresentacaoSlides = (
  dadosProcessados: DadosProcessados | null,
  dadosComparacao: DashboardResumoData[],
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string,
  pracaSelecionada: string | null,
  visibleSections: Record<string, boolean> = {
    capa: true,
    'resumo-ia': true,
    'aderencia-geral': true,
    'ranking': true,
    'sub-pracas': true,
    'aderencia-diaria': true,
    turnos: true,
    origens: true,
    demanda: true,
  },
  mediaFiles: string[] = []
) => {
  const slides = useMemo(() => {
    if (!dadosProcessados) {
      return [] as Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    }

    const slidesConfig: Array<{ key: string; render: (visible: boolean) => React.ReactNode }> = [];
    const { resumoSemana1, resumoSemana2, variacaoResumo, subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens } = dadosProcessados;

    // 1. Capa
    if (visibleSections.capa) {
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
    }

    // 2. Resumo IA
    if (visibleSections['resumo-ia']) {
      const insights = generateSmartInsights(dadosProcessados);
      slidesConfig.push({
        key: 'resumo-ia',
        render: (visible) => <SlideResumoIA isVisible={visible} insights={insights} />
      });
    }

    // 3. Aderência Geral
    if (visibleSections['aderencia-geral']) {
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
    }

    // 4. Ranking (Podium)
    if (visibleSections['ranking']) {
      const rankingItems = subPracasComparativo.map(item => ({
        nome: item.nome,
        aderencia: item.semana2.aderencia,
        horasEntregues: item.semana2.horasEntregues
      }));

      slidesConfig.push({
        key: 'ranking',
        render: (visible) => <SlideRanking isVisible={visible} itens={rankingItems} />
      });
    }

    // 5. Sub-Praças
    if (visibleSections['sub-pracas']) {
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
    }

    // 6. Aderência Diária
    if (visibleSections['aderencia-diaria']) {
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
    }

    // 7. Turnos
    if (visibleSections.turnos) {
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
    }

    // 8. Origens
    if (visibleSections.origens) {
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
    }

    // 9. Demanda
    if (visibleSections.demanda) {
      slidesConfig.push({
        key: 'demanda',
        render: (visible) => (
          <SlideDemanda
            isVisible={visible}
            itens={demandaItens}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
          />
        )
      });
    }

    // 10. Mídias (Fotos)
    mediaFiles.forEach((mediaUrl, index) => {
      slidesConfig.push({
        key: `media-${index}`,
        render: (visible) => <SlideMedia isVisible={visible} mediaUrl={mediaUrl} index={index} />
      });
    });

    return slidesConfig;
  }, [
    dadosProcessados,
    visibleSections,
    numeroSemana1,
    numeroSemana2,
    periodoSemana1,
    periodoSemana2,
    pracaSelecionada,
    mediaFiles
  ]);

  return slides;
};
