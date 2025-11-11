
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_VERDE,
  COR_VERMELHO,
} from '../constants';
import { adicionarBackgroundAoSlide, criarGraficoCircular } from '../utils';

export const criarSlideAderenciaGeral = (
  semana1: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  semana2: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
  variacao: { horasDiferenca: string; horasPercentual: string; positiva: boolean }
): any => {
  // Gráficos principais - tamanho otimizado
  const grafico1 = criarGraficoCircular(semana1.aderencia, 190, 16);
  const grafico2 = criarGraficoCircular(semana2.aderencia, 190, 16);

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA GERAL',
        fontSize: 48,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 16, 0, 8],
      },
      {
        text: `SEMANAS ${semana1.numeroSemana} & ${semana2.numeroSemana}`,
        fontSize: 24,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          // Semana 1
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${semana1.numeroSemana}`,
                fontSize: 28,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 20],
              },
              {
                svg: grafico1,
                width: 190,
                alignment: 'center',
                margin: [0, 0, 0, 12],
              },
              {
                stack: [
                  {
                    text: 'Planejado',
                    fontSize: 18,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana1.horasPlanejadas,
                    fontSize: 24,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                margin: [15, 0, 15, 8],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [12, 8],
              },
              {
                stack: [
                  {
                    text: 'Entregue',
                    fontSize: 18,
                    color: '#f3f4f6',
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana1.horasEntregues,
                    fontSize: 22,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                margin: [15, 0, 15, 8],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [12, 8],
              },
            ],
          },
          // Coluna central - Variação entre semanas
          {
            width: 'auto',
            stack: [
              {
                text: 'Variação',
                fontSize: 18,
                color: '#f3f4f6',
                alignment: 'center',
                margin: [0, 0, 0, 6],
              },
              {
                text: variacao.horasDiferenca,
                fontSize: 22,
                bold: true,
                color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
                margin: [0, 0, 0, 4],
              },
              {
                text: variacao.horasPercentual,
                fontSize: 18,
                bold: true,
                color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: [255, 255, 255, 0.10],
            borderRadius: 8,
            padding: [10, 8],
            margin: [8, 0, 8, 0],
          },
          // Semana 2
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${semana2.numeroSemana}`,
                fontSize: 28,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 20],
              },
              {
                svg: grafico2,
                width: 190,
                alignment: 'center',
                margin: [0, 0, 0, 12],
              },
              {
                stack: [
                  {
                    text: 'Planejado',
                    fontSize: 18,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana2.horasPlanejadas,
                    fontSize: 24,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                margin: [15, 0, 15, 8],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [12, 8],
              },
              {
                stack: [
                  {
                    text: 'Entregue',
                    fontSize: 18,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana2.horasEntregues,
                    fontSize: 22,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                margin: [15, 0, 15, 8],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [12, 8],
              },
            ],
          },
        ],
        columnGap: 24,
        margin: [20, 0, 20, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
