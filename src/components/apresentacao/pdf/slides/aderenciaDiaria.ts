import { criarSlideComLayout } from '../helpers';
import { criarCardDia, criarCabecalhoSemana } from './components/aderenciaCard';

// Função para criar slide de aderência diária - Design Premium
export const criarSlideAderenciaDiaria = (
  numeroSemana1: string,
  numeroSemana2: string,
  semana1Dias: Array<{ nome: string; sigla: string; aderencia: number; horasEntregues: string }>,
  semana2Dias: Array<{
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
    diferencaHoras: string;
    diferencaHorasPositiva: boolean;
    diferencaPercentualHoras: string;
    diferencaPercentualHorasPositiva: boolean;
    diferencaAderencia: string;
    diferencaAderenciaPositiva: boolean;
  }>
): any => {
  const conteudo = {
    stack: [
      // Semana 1
      criarCabecalhoSemana(numeroSemana1),
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 6,
        margin: [0, 0, 0, 25],
      },
      // Semana 2
      criarCabecalhoSemana(numeroSemana2),
      {
        columns: semana2Dias.map((dia) =>
          criarCardDia(dia, true, {
            diferencaHoras: dia.diferencaHoras,
            diferencaHorasPositiva: dia.diferencaHorasPositiva,
            diferencaPercentualHoras: dia.diferencaPercentualHoras,
            diferencaPercentualHorasPositiva: dia.diferencaPercentualHorasPositiva,
            diferencaAderencia: dia.diferencaAderencia,
            diferencaAderenciaPositiva: dia.diferencaAderenciaPositiva,
          })
        ),
        columnGap: 6,
      },
    ],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência Diária',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`
  );
};
