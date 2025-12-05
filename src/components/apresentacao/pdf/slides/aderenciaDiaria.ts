
import { COR_TEXTO, COR_VERDE, COR_VERMELHO, COR_PRIMARIA, COR_CINZA_CLARO, COR_SUBTITULO, BORDA_RAIO_MEDIO } from '../constants';
import { criarSlideComLayout, criarGraficoCircular, obterSeta } from '../helpers';

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
    // Gráfico para cards diários - otimizado
    const grafico = criarGraficoCircular(dia.aderencia, 65, 6, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
      width: '*',
      stack: [
        // Nome do dia
        {
          text: dia.sigla,
          fontSize: 13,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 8, 0, 8],
          characterSpacing: 0.5,
        },
        // Gráfico circular
        {
          svg: grafico,
          width: 65,
          alignment: 'center',
          margin: [0, 0, 0, 8],
        },
        // Horas entregues
        {
          stack: [
            {
              text: 'ENTREGUE',
              fontSize: 8,
              color: COR_SUBTITULO,
              alignment: 'center',
              bold: true,
              characterSpacing: 0.3,
              margin: [0, 0, 0, 3],
            },
            {
              text: dia.horasEntregues,
              fontSize: 11,
              bold: true,
              color: COR_VERDE,
              alignment: 'center',
            },
          ],
          fillColor: '#ffffff',
          borderRadius: 6,
          padding: [6, 5],
          margin: [4, 0, 4, 4],
        },
        // Diferenças (se existirem) com setas Unicode
        ...(temDiferencas && diferencas
          ? [
            {
              stack: [
                {
                  text: 'VARIAÇÃO',
                  fontSize: 8,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  bold: true,
                  characterSpacing: 0.3,
                  margin: [0, 0, 0, 4],
                },
                // Seta + Valor de horas
                {
                  text: `${obterSeta(diferencas.diferencaHorasPositiva)} ${diferencas.diferencaHoras}`,
                  fontSize: 10,
                  bold: true,
                  color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                  alignment: 'center',
                  margin: [0, 0, 0, 2],
                },
                // Seta + Percentual
                {
                  text: `${obterSeta(diferencas.diferencaPercentualHorasPositiva)} ${diferencas.diferencaPercentualHoras}`,
                  fontSize: 9,
                  bold: true,
                  color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                  alignment: 'center',
                },
              ],
              fillColor: diferencas.diferencaPercentualHorasPositiva ? '#ecfdf5' : '#fef2f2',
              borderRadius: 6,
              padding: [6, 5],
              margin: [4, 0, 4, 6],
            },
          ]
          : [{ text: '', margin: [0, 0, 0, 6] }]),
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: BORDA_RAIO_MEDIO,
      margin: [3, 0],
    };
  };

  const conteudo = {
    stack: [
      // Semana 1
      {
        columns: [
          {
            width: 'auto',
            text: `SEMANA ${numeroSemana1}`,
            fontSize: 14,
            bold: true,
            color: COR_PRIMARIA,
            characterSpacing: 0.5,
            margin: [0, 5, 0, 0],
          },
          {
            width: '*',
            canvas: [
              {
                type: 'line',
                x1: 10,
                y1: 10,
                x2: 700,
                y2: 10,
                lineWidth: 1,
                lineColor: '#e2e8f0',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 6,
        margin: [0, 0, 0, 25],
      },
      // Semana 2
      {
        columns: [
          {
            width: 'auto',
            text: `SEMANA ${numeroSemana2}`,
            fontSize: 14,
            bold: true,
            color: COR_PRIMARIA,
            characterSpacing: 0.5,
            margin: [0, 5, 0, 0],
          },
          {
            width: '*',
            canvas: [
              {
                type: 'line',
                x1: 10,
                y1: 10,
                x2: 700,
                y2: 10,
                lineWidth: 1,
                lineColor: '#e2e8f0',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 12],
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
