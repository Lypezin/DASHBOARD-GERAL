
import { COR_TEXTO, COR_VERDE, COR_VERMELHO } from '../constants';
import { adicionarBackgroundAoSlide, criarGraficoCircular } from '../utils';

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
    const grafico1 = criarGraficoCircular(turno.semana1.aderencia, 160, 14);
    const grafico2 = criarGraficoCircular(turno.semana2.aderencia, 160, 14);

    return {
      width: '*',
      stack: [
        {
          text: turno.nome,
          fontSize: 26,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 18],
        },
      {
        columns: [
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana1}`,
                fontSize: 18,
                bold: true,
                color: '#e5e7eb',
                alignment: 'center',
                margin: [0, 0, 0, 10],
              },
              {
                svg: grafico1,
                width: 160,
                alignment: 'center',
                margin: [0, 0, 0, 12],
              },
              {
                stack: [
                  {
                    text: 'Horas Entregues',
                    fontSize: 15,
                    color: '#f3f4f6',
                    alignment: 'center',
                    margin: [0, 0, 0, 4],
                  },
                  {
                    text: turno.semana1.horasEntregues,
                    fontSize: 20,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 10,
                padding: [12, 10],
              },
            ],
          },
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana2}`,
                fontSize: 18,
                bold: true,
                color: '#e5e7eb',
                alignment: 'center',
                margin: [0, 0, 0, 10],
              },
              {
                svg: grafico2,
                width: 160,
                alignment: 'center',
                margin: [0, 0, 0, 12],
              },
              {
                stack: [
                  {
                    text: 'Horas Entregues',
                    fontSize: 15,
                    color: '#f3f4f6',
                    alignment: 'center',
                    margin: [0, 0, 0, 4],
                  },
                  {
                    text: turno.semana2.horasEntregues,
                    fontSize: 20,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 10,
                padding: [12, 10],
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
                fontSize: 14,
                color: '#d1d5db',
                alignment: 'center',
                margin: [0, 0, 0, 3],
              },
              {
                text: variacao.valor,
                fontSize: 17,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: [255, 255, 255, 0.10],
            borderRadius: 8,
            padding: [10, 8],
            margin: [3, 0, 3, 0],
          })),
          columnGap: 10,
        },
      ],
      fillColor: [255, 255, 255, 0.15],
      borderRadius: 16,
      padding: [20, 18],
      margin: [8, 0, 8, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA POR TURNO',
        fontSize: 46,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 20, 0, 8],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 26,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },
      ...(totalPaginas > 1
        ? [
            {
              text: `Página ${paginaAtual} de ${totalPaginas}`,
              fontSize: 18,
              color: '#e5e7eb',
              alignment: 'center',
              margin: [0, 0, 0, 20],
            },
          ]
        : [{ text: '', margin: [0, 0, 0, 20] }]),
      {
        columns: itens.map((turno) => criarCardTurno(turno)),
        columnGap: 20,
        margin: [20, 0, 20, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
