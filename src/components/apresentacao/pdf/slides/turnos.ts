
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

// Função para criar slide de turnos - Design Premium
export const criarSlideTurnos = (
  numeroSemana1: string,
  numeroSemana2: string,
  paginaAtual: number,
  totalPaginas: number,
  itens: Array<{
    nome: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
  }>
): any => {
  const criarCardTurno = (turno: typeof itens[0]) => {
    const graficoSize = 120;
    const grafico1 = criarGraficoCircular(turno.semana1.aderencia, graficoSize, 14, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(turno.semana2.aderencia, graficoSize, 14, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
      width: '*',
      stack: [
        // Nome do turno
        {
          text: turno.nome,
          fontSize: 22,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 15, 0, 20],
          characterSpacing: 0.5,
        },
        // Gráficos lado a lado
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
                  characterSpacing: 0.5,
                  margin: [0, 0, 0, 12],
                },
                {
                  svg: grafico1,
                  width: graficoSize,
                  alignment: 'center',
                  margin: [0, 0, 0, 12],
                },
                {
                  text: 'ENTREGUE',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  bold: true,
                  margin: [0, 0, 0, 4],
                },
                {
                  text: turno.semana1.horasEntregues,
                  fontSize: 16,
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
                  fontSize: 12,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  characterSpacing: 0.5,
                  margin: [0, 0, 0, 12],
                },
                {
                  svg: grafico2,
                  width: graficoSize,
                  alignment: 'center',
                  margin: [0, 0, 0, 12],
                },
                {
                  text: 'ENTREGUE',
                  fontSize: 9,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  bold: true,
                  margin: [0, 0, 0, 4],
                },
                {
                  text: turno.semana2.horasEntregues,
                  fontSize: 16,
                  bold: true,
                  color: COR_VERDE,
                  alignment: 'center',
                },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 20],
        },
        // Variações em badges elegantes com setas Unicode
        {
          columns: turno.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label.toUpperCase(),
                fontSize: 9,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.3,
                margin: [0, 0, 0, 5],
              },
              // Valor com seta Unicode
              {
                text: `${obterSeta(variacao.positivo)} ${variacao.valor}`,
                fontSize: 14,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: variacao.positivo ? '#ecfdf5' : '#fef2f2',
            borderRadius: 8,
            padding: [10, 8],
            margin: [4, 0],
          })),
          columnGap: 12,
        },
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: BORDA_RAIO_GRANDE,
      padding: [20, 15],
    };
  };

  const conteudo = {
    columns: itens.map((turno) => criarCardTurno(turno)),
    columnGap: 30,
    margin: [0, 15, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência por Turno',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`,
    false,
    paginaAtual,
    totalPaginas
  );
};
