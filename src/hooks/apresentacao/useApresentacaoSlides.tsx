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

const SUB_PRACAS_PER_PAGE = 4;
const TURNOS_PER_PAGE = 2; // Reduced from 3 to 2 for larger display
const ORIGENS_PER_PAGE = 3; // Reduced from 6 to 3 for larger display

import SlideRanking from '@/components/apresentacao/slides/SlideRanking';
import SlideResumoIA from '@/components/apresentacao/slides/SlideResumoIA';
import { generateSmartInsights } from '@/utils/apresentacao/smartInsights';

// ... (existing constants)

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
    'resumo-ia': true, // New
    'aderencia-geral': true,
    'ranking': true, // New
    'sub-pracas': true,
    'aderencia-diaria': true,
    'turnos': true,
    'origens': true,
    'demanda': true,
  }
) => {
  const slides = useMemo(() => {
    if (!dadosProcessados) {
      // ... (error handling)
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
    // ... (rest of slides: daily, turnos, origens context unchanged in logic, just re-verify order later if needed)

    // Resume original simplified flow for replacement:
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

    // ... [KEEP EXISTING TURNOS/ORIGENS/DEMANDA LOGIC HERE - I will use a different replace strategy to avoid cutting code]
    // Ah, replace_file_content replaces chunks. I should target specific sections.

    // I will rewrite this Strategy.
    // Instead of replacing the massive block, I will Insert imports at the top
    // And Insert the new slide blocks in specific positions.

    return slidesConfig;

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

  if (visibleSections.demanda) {
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
  }

  return slidesConfig;
}, [dadosProcessados, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2, pracaSelecionada, dadosComparacao?.length, visibleSections]);

return slides;
};

