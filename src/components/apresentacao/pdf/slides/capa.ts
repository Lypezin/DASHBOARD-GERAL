
import { COR_TEXTO_CLARO } from '../constants';
import { criarSlideComLayout } from '../helpers';

// Função para criar slide de capa
export const criarSlideCapa = (
  praca: string | null,
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string
): any => {
  const conteudo = {
    stack: [
      {
        text: 'RELATÓRIO DE RESULTADOS',
        fontSize: 64,
        bold: true,
        color: COR_TEXTO_CLARO,
        alignment: 'center',
        margin: [0, 100, 0, 30],
        characterSpacing: 2,
      },
      {
        text: (praca || 'TODAS AS PRAÇAS').toUpperCase(),
        fontSize: 42,
        color: COR_TEXTO_CLARO,
        alignment: 'center',
        margin: [0, 0, 0, 60],
        characterSpacing: 1,
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 32,
        color: COR_TEXTO_CLARO,
        alignment: 'center',
        margin: [0, 0, 0, 20],
        bold: true,
      },
      {
        text: `${periodoSemana1} | ${periodoSemana2}`,
        fontSize: 24,
        color: '#e2e8f0', // Slate 200
        alignment: 'center',
        italics: true,
      },
    ],
  };

  // isCapa = true
  return criarSlideComLayout(conteudo, undefined, undefined, true);
};
