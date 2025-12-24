
import { criarSlideComLayout } from '../helpers';
import {
  buildTopDecoration,
  buildMainTitle,
  buildDivider,
  buildPracaText,
  buildWeeksContainer,
  buildFooterDate
} from './components/capaHelpers';

// Função para criar slide de capa - Design Premium
export const criarSlideCapa = (
  praca: string | null,
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string
): any => {
  const conteudo = {
    stack: [
      // Espaçamento superior aumentado para melhor centralização
      { text: '', margin: [0, 80, 0, 0] },

      buildTopDecoration(),
      buildMainTitle(),
      buildDivider(),
      buildPracaText(praca),
      buildWeeksContainer(numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2),
      buildFooterDate(),
    ],
  };

  return criarSlideComLayout(conteudo, undefined, undefined, true);
};
