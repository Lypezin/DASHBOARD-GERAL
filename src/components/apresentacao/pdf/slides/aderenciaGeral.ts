import {
  COR_TEXTO,
  COR_SUBTITULO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
} from '../constants';
import { criarSlideComLayout, criarGraficoCircular, obterSeta } from '../helpers';
import { criarCardSemana } from './components/aderenciaGeralCard';

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

  const conteudo = {
    columns: [
      // Semana 1
      criarCardSemana(semana1, grafico1, graficoSize),

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
      criarCardSemana(semana2, grafico2, graficoSize, true),
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
