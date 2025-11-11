
import { COR_TEXTO, COR_VERDE, COR_VERMELHO } from '../constants';
import { adicionarBackgroundAoSlide, criarGraficoCircular } from '../utils';

// Função para criar slide de aderência diária
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
  const criarCardDia = (
    dia: { sigla: string; aderencia: number; horasEntregues: string },
    temDiferencas: boolean = false,
    diferencas?: {
      diferencaHoras: string;
      diferencaHorasPositiva: boolean;
      diferencaPercentualHoras: string;
      diferencaPercentualHorasPositiva: boolean;
      diferencaAderencia: string;
      diferencaAderenciaPositiva: boolean;
    }
  ) => {
    // Gráfico para cards diários - otimizado para altura
    const grafico = criarGraficoCircular(dia.aderencia, 72, 6);
    return {
      width: '*',
      stack: [
        {
          text: dia.sigla,
          fontSize: 14,
          bold: true,
          color: '#e5e7eb',
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          svg: grafico,
          width: 72,
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          stack: [
            {
              text: 'Horas Entregues',
              fontSize: 10,
              color: '#e5e7eb',
              alignment: 'center',
              margin: [0, 0, 0, 1],
            },
            {
              text: dia.horasEntregues,
              fontSize: 11,
              bold: true,
              color: COR_VERDE,
              alignment: 'center',
            },
          ],
          fillColor: [255, 255, 255, 0.10],
          borderRadius: 5,
          padding: [4, 3],
          margin: [2, 0, 2, 0],
        },
        ...(temDiferencas && diferencas
          ? [
              {
                stack: [
                  {
                    text: 'Diferenças',
                    fontSize: 10,
                    color: '#f3f4f6',
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaHoras,
                    fontSize: 12,
                    bold: true,
                    color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaPercentualHoras,
                    fontSize: 10,
                    bold: true,
                    color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaAderencia,
                    fontSize: 9,
                    bold: true,
                    color: diferencas.diferencaAderenciaPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 5,
                padding: [4, 3],
                margin: [2, 2, 2, 0],
              },
            ]
          : []),
      ],
      fillColor: [255, 255, 255, 0.12],
      borderRadius: 8,
      padding: [4, 4],
      margin: [1, 0, 1, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA DIÁRIA',
        fontSize: 40,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 15, 0, 5],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 24,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 12],
      },
      {
        text: `SEMANA ${numeroSemana1}`,
        fontSize: 17,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 5,
        margin: [8, 0, 8, 12],
      },
      {
        text: `SEMANA ${numeroSemana2}`,
        fontSize: 17,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },
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
        columnGap: 5,
        margin: [8, 0, 8, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
