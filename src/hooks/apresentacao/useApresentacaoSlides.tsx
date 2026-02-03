import { useMemo } from 'react';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { safeLog } from '@/lib/errorHandler';
import { DashboardResumoData } from '@/types/dashboard';
import { MediaSlideData } from '@/types/presentation';
import SlideMedia from '@/components/apresentacao/slides/SlideMedia';
import SlideUTR from '@/components/apresentacao/slides/SlideUTR';
import SlideCapaFinal from '@/components/apresentacao/slides/SlideCapaFinal';
import {
  buildSlideCapa,
  buildSlideResumoIA,
  buildSlideAderenciaGeral,
  buildSlideRanking,
  buildSlidesSubPracas,
  buildSlideAderenciaDiaria,
  buildSlidesTurnos,
  buildSlidesOrigem,
  buildSlideDemanda,
  SlideConfig
} from './utils/slideBuilders';

export const useApresentacaoSlides = (
  dadosProcessados: DadosProcessados | null,
  dadosComparacao: DashboardResumoData[],
  utrComparacao: any[], // Add type here
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
    'utr': true, // Add default true
    turnos: true,
    origens: true,
    demanda: true,
  },
  mediaSlides: MediaSlideData[] = [],
  onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void
) => {
  const slides = useMemo(() => {
    if (!dadosProcessados) {
      return [] as Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    }

    const slidesConfig: SlideConfig[] = [];
    const { subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens } = dadosProcessados;

    // 1. Capa
    const capa = buildSlideCapa(visibleSections.capa, { pracaSelecionada, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2 });
    if (capa) slidesConfig.push(capa);

    // 2. Resumo IA
    const resumoIA = buildSlideResumoIA(visibleSections['resumo-ia'], dadosProcessados);
    if (resumoIA) slidesConfig.push(resumoIA);

    // 3. Aderencia Geral
    const aderenciaGeral = buildSlideAderenciaGeral(visibleSections['aderencia-geral'], dadosProcessados);
    if (aderenciaGeral) slidesConfig.push(aderenciaGeral);

    // 4. Ranking
    const ranking = buildSlideRanking(visibleSections['ranking'], subPracasComparativo);
    if (ranking) slidesConfig.push(ranking);

    // 5. Sub-Pracas
    const subPracas = buildSlidesSubPracas(visibleSections['sub-pracas'], subPracasComparativo, { numeroSemana1, numeroSemana2 });
    slidesConfig.push(...subPracas);

    // 6. Aderencia Diaria
    const aderenciaDiaria = buildSlideAderenciaDiaria(visibleSections['aderencia-diaria'], { numeroSemana1, numeroSemana2, semana1Dias, semana2Dias });
    if (aderenciaDiaria) slidesConfig.push(aderenciaDiaria);

    // 7 UTR (New)
    if (visibleSections['utr'] !== false) { // Default to true if undefined
      slidesConfig.push({
        key: 'utr',
        render: (visible: boolean) => (
          <SlideUTR
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            utrComparacao={utrComparacao}
          />
        )
      });
    }

    // 8. Turnos
    const turnos = buildSlidesTurnos(visibleSections.turnos, turnosComparativo, { numeroSemana1, numeroSemana2 });
    slidesConfig.push(...turnos);

    // 9. Origens
    safeLog.info('[Apresentacao] Building origens slides:', {
      origensVisible: visibleSections.origens,
      origensCount: origensComparativo?.length,
      origensPreview: origensComparativo?.slice(0, 2)
    });
    const origens = buildSlidesOrigem(visibleSections.origens, origensComparativo, { numeroSemana1, numeroSemana2 });
    safeLog.info('[Apresentacao] Origens slides built:', origens.length);
    slidesConfig.push(...origens);

    // 10. Demanda
    const demanda = buildSlideDemanda(visibleSections.demanda, demandaItens, { numeroSemana1, numeroSemana2 });
    if (demanda) slidesConfig.push(demanda);

    // 11. Mídias
    mediaSlides.forEach((slideData, index) => {
      slidesConfig.push({
        key: `media-${slideData.id}`,
        render: (visible) => (
          <SlideMedia
            isVisible={visible}
            slideData={slideData}
            index={index}
            onUpdate={(updates) => onUpdateMediaSlide?.(slideData.id, updates)}
          />
        )
      });
    });

    // 12. Capa Final
    if (visibleSections['capa-final']) {
      slidesConfig.push({
        key: 'capa-final',
        render: (visible) => <SlideCapaFinal isVisible={visible} />
      });
    }

    return slidesConfig;
  }, [
    dadosProcessados,
    visibleSections,
    numeroSemana1,
    numeroSemana2,
    periodoSemana1,
    periodoSemana2,
    pracaSelecionada,
    mediaSlides,
    utrComparacao
  ]);

  return slides;
};
