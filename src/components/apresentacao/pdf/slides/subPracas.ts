
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_SUBTITULO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
  COR_BORDA,
} from '../constants';
import { criarSlideComLayout, criarGraficoCircular } from '../helpers';

// Função para criar slide de sub-praças (agora genérica para aceitar título)
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
  }>,
  titulo: string = 'Sub-Praças'
): any => {
  const criarCardSubPraca = (item: typeof itens[0]) => {
    // Gráficos para sub-praças - compactados para caber em 1 página
    const grafico1 = criarGraficoCircular(item.semana1.aderencia, 120, 10, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(item.semana2.aderencia, 120, 10, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
      width: '*',
      stack: [
        {
          text: item.nome,
          fontSize: 18,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          stack: [
            {
              text: 'Planejado',
              fontSize: 12,
              color: COR_SUBTITULO,
              alignment: 'center',
              margin: [0, 0, 0, 2],
            },
            {
              text: item.horasPlanejadas,
              fontSize: 16,
              bold: true,
              color: COR_PRIMARIA,
              alignment: 'center',
            },
          ],
          fillColor: '#ffffff',
          borderRadius: 6,
          padding: [8, 6],
          margin: [0, 0, 0, 12],
          border: [true, true, true, true],
          borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana1}`,
                  fontSize: 12,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  svg: grafico1,
                  width: 120,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  stack: [
                    {
                      text: 'Entregue',
                      fontSize: 11,
                      color: COR_SUBTITULO,
                      alignment: 'center',
                      margin: [0, 0, 0, 2],
                    },
                    {
                      text: item.semana1.horasEntregues,
                      fontSize: 14,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana2}`,
                  fontSize: 12,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  svg: grafico2,
                  width: 120,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  stack: [
                    {
                      text: 'Entregue',
                      fontSize: 11,
                      color: COR_SUBTITULO,
                      alignment: 'center',
                      margin: [0, 0, 0, 2],
                    },
                    {
                      text: item.semana2.horasEntregues,
                      fontSize: 14,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                },
              ],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 12],
        },
        {
          columns: item.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label,
                fontSize: 10,
                color: COR_SUBTITULO,
                alignment: 'center',
                margin: [0, 0, 0, 2],
              },
              {
                text: variacao.valor,
                fontSize: 12,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: '#ffffff',
            borderRadius: 4,
            padding: [6, 4],
            margin: [2, 0, 2, 0],
          })),
          columnGap: 6,
        },
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: 12,
      padding: [16, 14],
      margin: [0, 0, 0, 0],
    };
  };

  const conteudo = {
    columns: itens.map((item) => criarCardSubPraca(item)),
    columnGap: 20,
    margin: [0, 20, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    titulo,
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`,
    false,
    paginaAtual,
    totalPaginas
  );
};
