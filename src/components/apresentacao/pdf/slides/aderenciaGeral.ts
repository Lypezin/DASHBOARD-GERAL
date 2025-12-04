
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_SUBTITULO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
} from '../constants';
import { criarSlideComLayout, criarGraficoCircular } from '../helpers';

export const criarSlideAderenciaGeral = (
  semana1: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  semana2: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  variacao: { horasDiferenca: string; horasPercentual: string; positiva: boolean }
): any => {
  // Gráficos circulares adaptados para fundo branco
  const grafico1 = criarGraficoCircular(
    semana1.aderencia,
    160,
    16,
    COR_TEXTO,
    COR_PRIMARIA,
    '#e2e8f0'
  );

  const grafico2 = criarGraficoCircular(
    semana2.aderencia,
    160,
    16,
    COR_TEXTO,
    COR_PRIMARIA,
    '#e2e8f0'
  );

  const conteudo = {
    columns: [
      // Semana 1
      {
        width: '*',
        stack: [
          {
            text: `SEMANA ${semana1.numeroSemana}`,
            fontSize: 20,
            bold: true,
            color: COR_TEXTO,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          {
            svg: grafico1,
            width: 160,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          {
            layout: 'noBorders',
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Planejado', color: COR_SUBTITULO, fontSize: 12, alignment: 'center' },
                  { text: 'Entregue', color: COR_SUBTITULO, fontSize: 12, alignment: 'center' }
                ],
                [
                  { text: semana1.horasPlanejadas, color: COR_TEXTO, fontSize: 16, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
                  { text: semana1.horasEntregues, color: COR_VERDE, fontSize: 16, bold: true, alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              ]
            },
            margin: [20, 0, 20, 0]
          }
        ],
        fillColor: COR_CINZA_CLARO,
        borderRadius: 8,
        padding: [0, 20, 0, 20],
      },

      // Coluna central - Variação
      {
        width: 'auto',
        stack: [
          {
            text: 'Variação',
            fontSize: 14,
            color: COR_SUBTITULO,
            alignment: 'center',
            margin: [0, 60, 0, 10],
          },
          {
            text: variacao.horasDiferenca,
            fontSize: 24,
            bold: true,
            color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
            margin: [0, 0, 0, 5],
          },
          {
            text: variacao.horasPercentual,
            fontSize: 18,
            bold: true,
            color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
          },
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 100, y2: 0,
                lineWidth: 1,
                lineColor: '#e2e8f0',
              }
            ],
            margin: [0, 20, 0, 0],
            alignment: 'center'
          }
        ],
        margin: [20, 0, 20, 0],
      },

      // Semana 2
      {
        width: '*',
        stack: [
          {
            text: `SEMANA ${semana2.numeroSemana}`,
            fontSize: 20,
            bold: true,
            color: COR_TEXTO,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          {
            svg: grafico2,
            width: 160,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          {
            layout: 'noBorders',
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Planejado', color: COR_SUBTITULO, fontSize: 12, alignment: 'center' },
                  { text: 'Entregue', color: COR_SUBTITULO, fontSize: 12, alignment: 'center' }
                ],
                [
                  { text: semana2.horasPlanejadas, color: COR_TEXTO, fontSize: 16, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
                  { text: semana2.horasEntregues, color: COR_VERDE, fontSize: 16, bold: true, alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              ]
            },
            margin: [20, 0, 20, 0]
          }
        ],
        fillColor: COR_CINZA_CLARO,
        borderRadius: 8,
        padding: [0, 20, 0, 20],
      },
    ],
    columnGap: 20,
    margin: [0, 20, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência Geral',
    `Comparativo Semanas ${semana1.numeroSemana} vs ${semana2.numeroSemana}`
  );
};
