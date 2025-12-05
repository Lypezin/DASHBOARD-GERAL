
import {
  COR_TEXTO,
  COR_SUBTITULO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
  BORDA_RAIO_GRANDE,
} from '../constants';
import { criarSlideComLayout, criarGraficoCircular, obterSeta } from '../helpers';

// Função para criar slide de sub-praças com design premium
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
    const graficoSize = 120;
    const grafico1 = criarGraficoCircular(item.semana1.aderencia, graficoSize, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(item.semana2.aderencia, graficoSize, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
      width: '*',
      stack: [
        // Nome da sub-praça
        {
          text: item.nome,
          fontSize: 20,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 15, 0, 15],
          characterSpacing: 0.5,
        },
        // Badge de horas planejadas
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              stack: [
                {
                  text: 'PLANEJADO',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  bold: true,
                  characterSpacing: 0.5,
                },
                {
                  text: item.horasPlanejadas,
                  fontSize: 16,
                  bold: true,
                  color: COR_PRIMARIA,
                  alignment: 'center',
                  margin: [0, 4, 0, 0],
                },
              ],
              fillColor: '#ffffff',
              borderRadius: 6,
              padding: [15, 8],
            },
            { width: '*', text: '' },
          ],
          margin: [0, 0, 0, 20],
        },
        // Gráficos lado a lado
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana1}`,
                  fontSize: 11,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  characterSpacing: 0.5,
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico1,
                  width: graficoSize,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: 'ENTREGUE',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 4],
                },
                {
                  text: item.semana1.horasEntregues,
                  fontSize: 15,
                  bold: true,
                  color: COR_VERDE,
                  alignment: 'center',
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana2}`,
                  fontSize: 11,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  characterSpacing: 0.5,
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico2,
                  width: graficoSize,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: 'ENTREGUE',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 4],
                },
                {
                  text: item.semana2.horasEntregues,
                  fontSize: 15,
                  bold: true,
                  color: COR_VERDE,
                  alignment: 'center',
                },
              ],
            },
          ],
          columnGap: 15,
          margin: [0, 0, 0, 20],
        },
        // Variações em badges horizontais com setas Unicode
        {
          columns: item.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label.toUpperCase(),
                fontSize: 8,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.3,
                margin: [0, 0, 0, 4],
              },
              // Valor com seta Unicode
              {
                text: `${obterSeta(variacao.positivo)} ${variacao.valor}`,
                fontSize: 13,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: variacao.positivo ? '#ecfdf5' : '#fef2f2',
            borderRadius: 6,
            padding: [8, 6],
            margin: [2, 0],
          })),
          columnGap: 8,
        },
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: BORDA_RAIO_GRANDE,
      padding: [20, 15],
    };
  };

  const conteudo = {
    columns: itens.map((item) => criarCardSubPraca(item)),
    columnGap: 30,
    margin: [0, 15, 0, 0],
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
