
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

// Função para criar slide de turnos
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
    // Gráficos para turnos - otimizados para 2 por página
    const grafico1 = criarGraficoCircular(turno.semana1.aderencia, 140, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(turno.semana2.aderencia, 140, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
      width: '*',
      stack: [
        {
          text: turno.nome,
          fontSize: 22,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 15],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana1}`,
                  fontSize: 14,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  svg: grafico1,
                  width: 140,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 12,
                      color: COR_SUBTITULO,
                      alignment: 'center',
                      margin: [0, 0, 0, 2],
                    },
                    {
                      text: turno.semana1.horasEntregues,
                      fontSize: 16,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: '#ffffff',
                  borderRadius: 6,
                  padding: [8, 6],
                  border: [true, true, true, true],
                  borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEMANA ${numeroSemana2}`,
                  fontSize: 14,
                  bold: true,
                  color: COR_SUBTITULO,
                  alignment: 'center',
                  margin: [0, 0, 0, 8],
                },
                {
                  svg: grafico2,
                  width: 140,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 12,
                      color: COR_SUBTITULO,
                      alignment: 'center',
                      margin: [0, 0, 0, 2],
                    },
                    {
                      text: turno.semana2.horasEntregues,
                      fontSize: 16,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: '#ffffff',
                  borderRadius: 6,
                  padding: [8, 6],
                  border: [true, true, true, true],
                  borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
                },
              ],
            },
          ],
          columnGap: 15,
          margin: [0, 0, 0, 15],
        },
        {
          columns: turno.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label,
                fontSize: 12,
                color: COR_SUBTITULO,
                alignment: 'center',
                margin: [0, 0, 0, 2],
              },
              {
                text: variacao.valor,
                fontSize: 14,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: '#ffffff',
            borderRadius: 6,
            padding: [8, 6],
            margin: [3, 0, 3, 0],
            border: [true, true, true, true],
            borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
          })),
          columnGap: 10,
        },
      ],
      fillColor: COR_CINZA_CLARO,
      borderRadius: 12,
      padding: [16, 14],
      margin: [8, 0, 8, 0],
    };
  };

  const conteudo = {
    columns: itens.map((turno) => criarCardTurno(turno)),
    columnGap: 20,
    margin: [0, 20, 0, 0],
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
