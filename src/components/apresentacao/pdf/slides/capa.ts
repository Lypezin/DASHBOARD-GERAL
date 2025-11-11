
import { COR_TEXTO } from '../constants';
import { adicionarBackgroundAoSlide } from '../utils';

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
        fontSize: 72,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 120, 0, 20],
      },
      {
        text: praca || 'TODAS AS PRAÇAS',
        fontSize: 48,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 60],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 36,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      {
        text: `${periodoSemana1} | ${periodoSemana2}`,
        fontSize: 24,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
