
import { COR_TEXTO, COR_VERDE, COR_VERMELHO, COR_PRIMARIA, COR_CINZA_CLARO, COR_SUBTITULO, COR_BORDA } from '../constants';
import { criarSlideComLayout, criarGraficoCircular } from '../helpers';

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
    const grafico = criarGraficoCircular(dia.aderencia, 60, 5, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    return {
      width: '*',
      stack: [
        {
          text: dia.sigla,
          fontSize: 12,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          svg: grafico,
          width: 60,
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          stack: [
            {
              text: 'Entregue',
              fontSize: 9,
              color: COR_SUBTITULO,
              alignment: 'center',
              margin: [0, 0, 0, 1],
            },
            {
              text: dia.horasEntregues,
              fontSize: 10,
              bold: true,
              color: COR_VERDE,
              alignment: 'center',
            },
          ],
          fillColor: '#ffffff',
          borderRadius: 4,
          padding: [4, 3],
          margin: [2, 0, 2, 0],
          border: [true, true, true, true],
          borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
        },
        ...(temDiferencas && diferencas
          ? [
            {
              stack: [
                {
                  text: 'Diferenças',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 1],
                },
                {
                  text: diferencas.diferencaHoras,
                  fontSize: 10,
                  bold: true,
                  color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                  alignment: 'center',
                  margin: [0, 0, 0, 1],
                },
                {
                  text: diferencas.diferencaPercentualHoras,
                  fontSize: 9,
                  bold: true,
                  color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                  alignment: 'center',
                  margin: [0, 0, 0, 1],
                },
                {
                  text: diferencas.diferencaAderencia,
                  fontSize: 8,
                  bold: true,
                  color: diferencas.diferencaAderenciaPositiva ? COR_VERDE : COR_VERMELHO,
                  alignment: 'center',
                },
              ],
              fillColor: '#ffffff',
              borderRadius: 4,
              padding: [4, 3],
              margin: [2, 2, 2, 0],
              border: [true, true, true, true],
              borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
            },
          ]
          : []),
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: 8,
      padding: [6, 6],
      margin: [2, 0, 2, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: `SEMANA ${numeroSemana1}`,
        fontSize: 16,
        bold: true,
        color: COR_PRIMARIA,
        alignment: 'left',
        margin: [0, 0, 0, 8],
      },
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 8,
        margin: [0, 0, 0, 20],
      },
      {
        text: `SEMANA ${numeroSemana2}`,
        fontSize: 16,
        bold: true,
        color: COR_PRIMARIA,
        alignment: 'left',
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
        columnGap: 8,
        margin: [0, 0, 0, 0],
      },
    ],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência Diária',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`
  );
};
