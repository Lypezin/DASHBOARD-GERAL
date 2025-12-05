
import {
  COR_TEXTO,
  COR_SUBTITULO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
  FONTE_TITULO,
  BORDA_RAIO_GRANDE,
} from '../constants';
import { criarSlideComLayout, criarGraficoCircular, obterSeta } from '../helpers';

export const criarSlideAderenciaGeral = (
  semana1: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  semana2: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  variacao: { horasDiferenca: string; horasPercentual: string; positiva: boolean }
): any => {
  // Gráficos circulares maiores com visual premium
  const graficoSize = 180;
  const grafico1 = criarGraficoCircular(
    semana1.aderencia,
    graficoSize,
    18,
    COR_TEXTO,
    COR_PRIMARIA,
    '#e2e8f0'
  );

  const grafico2 = criarGraficoCircular(
    semana2.aderencia,
    graficoSize,
    18,
    COR_TEXTO,
    COR_PRIMARIA,
    '#e2e8f0'
  );

  // Card estilizado para cada semana
  const criarCardSemana = (
    semana: typeof semana1,
    grafico: string,
    isSecondWeek: boolean = false
  ) => ({
    width: '*',
    stack: [
      // Header do card
      {
        text: `SEMANA ${semana.numeroSemana}`,
        fontSize: FONTE_TITULO,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 20, 0, 25],
        characterSpacing: 1,
      },
      // Gráfico centralizado
      {
        svg: grafico,
        width: graficoSize,
        alignment: 'center',
        margin: [0, 0, 0, 25],
      },
      // Métricas em layout elegante
      {
        columns: [
          {
            width: '*',
            stack: [
              {
                text: 'PLANEJADO',
                color: COR_SUBTITULO,
                fontSize: 10,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.5,
                margin: [0, 0, 0, 6],
              },
              {
                text: semana.horasPlanejadas,
                color: COR_TEXTO,
                fontSize: 18,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            width: '*',
            stack: [
              {
                text: 'ENTREGUE',
                color: COR_SUBTITULO,
                fontSize: 10,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.5,
                margin: [0, 0, 0, 6],
              },
              {
                text: semana.horasEntregues,
                color: COR_VERDE,
                fontSize: 18,
                bold: true,
                alignment: 'center',
              },
            ],
          },
        ],
        margin: [15, 0, 15, 20],
      },
    ],
    fillColor: COR_CINZA_CLARO,
    borderRadius: BORDA_RAIO_GRANDE,
  });

  const conteudo = {
    columns: [
      // Semana 1
      criarCardSemana(semana1, grafico1),

      // Coluna central - Variação com destaque
      {
        width: 160,
        stack: [
          { text: '', margin: [0, 50, 0, 0] },
          {
            text: 'VARIAÇÃO',
            fontSize: 11,
            color: COR_SUBTITULO,
            alignment: 'center',
            bold: true,
            characterSpacing: 1,
            margin: [0, 0, 0, 12],
          },
          // Seta Unicode grande
          {
            text: obterSeta(variacao.positiva),
            fontSize: 32,
            color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
            bold: true,
            margin: [0, 0, 0, 8],
          },
          // Valor principal
          {
            text: variacao.horasDiferenca,
            fontSize: 24,
            bold: true,
            color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
            margin: [0, 0, 0, 8],
          },
          // Percentual com seta
          {
            text: `${obterSeta(variacao.positiva)} ${variacao.horasPercentual}`,
            fontSize: 18,
            bold: true,
            color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
            margin: [0, 0, 0, 15],
          },
        ],
        fillColor: variacao.positiva ? '#ecfdf5' : '#fef2f2',
        borderRadius: 12,
        padding: [10, 15],
      },

      // Semana 2
      criarCardSemana(semana2, grafico2, true),
    ],
    columnGap: 30,
    margin: [0, 10, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência Geral',
    `Comparativo Semanas ${semana1.numeroSemana} vs ${semana2.numeroSemana}`
  );
};
