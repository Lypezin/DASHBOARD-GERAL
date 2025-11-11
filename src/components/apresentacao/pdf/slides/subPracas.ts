
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_VERDE,
  COR_VERMELHO,
} from '../constants';
import { adicionarBackgroundAoSlide, criarGraficoCircular } from '../utils';

// Função para criar slide de sub-praças
export const criarSlideSubPracas = (
  numeroSemana1: string,
  numeroSemana2: string,
  paginaAtual: number,
  totalPaginas: number,
  itens: Array<{
    nome: string;
    horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
  }>
): any => {
  const criarCardSubPraca = (item: typeof itens[0]) => {
    // Gráficos para sub-praças - compactados para caber em 1 página
    const grafico1 = criarGraficoCircular(item.semana1.aderencia, 140, 12);
    const grafico2 = criarGraficoCircular(item.semana2.aderencia, 140, 12);

    return {
      width: '*',
      stack: [
        {
          text: item.nome,
          fontSize: 22,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          stack: [
            {
              text: 'Planejado',
              fontSize: 15,
              color: '#e5e7eb',
              alignment: 'center',
              margin: [0, 0, 0, 3],
            },
            {
              text: item.horasPlanejadas,
              fontSize: 20,
              bold: true,
              color: COR_AZUL_CLARO,
              alignment: 'center',
            },
          ],
          fillColor: [255, 255, 255, 0.12],
          borderRadius: 8,
          padding: [10, 8],
          margin: [0, 0, 0, 12],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
              {
                text: `SEMANA ${numeroSemana1}`,
                fontSize: 16,
                bold: true,
                color: '#e5e7eb',
                alignment: 'center',
                margin: [0, 0, 0, 8],
              },
              {
                svg: grafico1,
                width: 140,
                alignment: 'center',
                margin: [0, 0, 0, 8],
              },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 13,
                      color: '#f3f4f6',
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: item.semana1.horasEntregues,
                      fontSize: 17,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10],
                  borderRadius: 8,
                  padding: [10, 8],
                },
              ],
            },
            {
              width: '*',
              stack: [
              {
                text: `SEMANA ${numeroSemana2}`,
                fontSize: 16,
                bold: true,
                color: '#e5e7eb',
                alignment: 'center',
                margin: [0, 0, 0, 8],
              },
              {
                svg: grafico2,
                width: 140,
                alignment: 'center',
                margin: [0, 0, 0, 8],
              },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 13,
                      color: '#f3f4f6',
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: item.semana2.horasEntregues,
                      fontSize: 17,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10],
                  borderRadius: 8,
                  padding: [10, 8],
                },
              ],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 8],
        },
        {
          columns: item.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label,
                fontSize: 12,
                color: '#d1d5db',
                alignment: 'center',
                margin: [0, 0, 0, 2],
              },
              {
                text: variacao.valor,
                fontSize: 15,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: [255, 255, 255, 0.10],
            borderRadius: 7,
            padding: [8, 6],
            margin: [2, 0, 2, 0],
          })),
          columnGap: 6,
        },
      ],
      fillColor: [255, 255, 255, 0.15],
      borderRadius: 14,
      padding: [14, 12],
      margin: [4, 0, 4, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'SUB-PRAÇAS',
        fontSize: 42,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 16, 0, 6],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 24,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 6],
      },
      ...(totalPaginas > 1
        ? [
            {
              text: `Página ${paginaAtual} de ${totalPaginas}`,
              fontSize: 16,
              color: '#e5e7eb',
              alignment: 'center',
              margin: [0, 0, 0, 15],
            },
          ]
        : [{ text: '', margin: [0, 0, 0, 15] }]),
      {
        columns: itens.map((item) => criarCardSubPraca(item)),
        columnGap: 14,
        margin: [12, 0, 12, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
