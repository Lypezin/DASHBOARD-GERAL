import { useMemo } from 'react';
import { DadosProcessados } from '@/utils/apresentacao/dataProcessor';
import { DashboardResumoData } from '@/types/dashboard';
import { MediaSlideData } from '@/types/presentation';
import { buildAllSlides } from './utils/buildAllSlides';

export const useApresentacaoSlides = (
  dadosProcessados: DadosProcessados | null,
  dadosComparacao: DashboardResumoData[],
  utrComparacao: any[],
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string,
  pracaSelecionada: string | null,
  visibleSections: Record<string, boolean> = {
    capa: true, 'resumo-ia': true, 'aderencia-geral': true, 'ranking': true, 'sub-pracas': true,
    'aderencia-diaria': true, 'utr': true, turnos: true, origens: true, 'demanda-origem': true, demanda: true,
  },
  mediaSlides: MediaSlideData[] = [],
  onUpdateMediaSlide?: (id: string, updates: Partial<MediaSlideData>) => void
) => {
  const slides = useMemo(() => {
    if (!dadosProcessados) {
      return [] as Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    }
    return buildAllSlides(dadosProcessados, utrComparacao, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2, pracaSelecionada, visibleSections, mediaSlides, onUpdateMediaSlide);
  }, [
    dadosProcessados, visibleSections, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2, pracaSelecionada, mediaSlides, utrComparacao, onUpdateMediaSlide
  ]);

  return slides;
};
