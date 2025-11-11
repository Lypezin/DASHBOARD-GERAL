import { formatarHorasParaHMS } from '@/utils/formatters';

// Cores do tema
const COR_PRIMARIA = '#2563eb';
const COR_SECUNDARIA = '#1e40af';
const COR_TEXTO = '#ffffff';
const COR_VERDE = '#10b981';
const COR_VERMELHO = '#ef4444';
const COR_AZUL_CLARO = '#93c5fd';

// Dimensões A4 landscape em pontos (1pt = 1/72 inch)
const A4_LANDSCAPE_WIDTH = 842; // 297mm
const A4_LANDSCAPE_HEIGHT = 595; // 210mm
// Altura disponível considerando margens de 30pt: 595 - 60 = 535pt

// Função para criar retângulo de fundo azul
const criarRetanguloFundo = () => ({
  canvas: [
    {
      type: 'rect',
      x: 0,
      y: 0,
      w: A4_LANDSCAPE_WIDTH,
      h: A4_LANDSCAPE_HEIGHT,
      color: COR_PRIMARIA,
    },
  ],
  absolutePosition: { x: 0, y: 0 },
});

// Função helper para envolver um slide com background
const adicionarBackgroundAoSlide = (conteudo: any) => {
  return {
    stack: [
      criarRetanguloFundo(),
      conteudo,
    ],
  };
};

// Função para criar gráfico circular como SVG
const criarGraficoCircular = (
  porcentagem: number,
  tamanho: number = 150,
  strokeWidth: number = 20
): string => {
  const radius = (tamanho - strokeWidth) / 2;
  const center = tamanho / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (porcentagem / 100) * circumference;

  return `
    <svg width="${tamanho}" height="${tamanho}" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        stroke-width="${strokeWidth}"
      />
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="#ffffff"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 ${center} ${center})"
        stroke-linecap="round"
      />
      <text
        x="${center}"
        y="${center + (tamanho > 200 ? 8 : tamanho > 100 ? 4 : 2)}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#ffffff"
        font-size="${tamanho > 200 ? 56 : tamanho > 100 ? 24 : 18}"
        font-weight="bold"
        font-family="Arial, sans-serif"
      >${porcentagem.toFixed(1)}%</text>
    </svg>
  `;
};

// Função para criar slide de capa
export const criarSlideCapa = (
  praca: string | null,
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string
): any => {
  const conteudo = {
    stack: [
      {
        text: 'RELATÓRIO DE RESULTADOS',
        fontSize: 72,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 120, 0, 20],
      },
      {
        text: praca || 'TODAS AS PRAÇAS',
        fontSize: 48,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 60],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 36,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      {
        text: `${periodoSemana1} | ${periodoSemana2}`,
        fontSize: 24,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};

// Função para criar slide de aderência geral
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

// Função para criar slide de aderência diária
export const criarSlideAderenciaDiaria = (
  numeroSemana1: string,
  numeroSemana2: string,
  semana1Dias: Array<{ nome: string; sigla: string; aderencia: number; horasEntregues: string }>,
  semana2Dias: Array<{
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
    diferencaHoras: string;
    diferencaHorasPositiva: boolean;
    diferencaPercentualHoras: string;
    diferencaPercentualHorasPositiva: boolean;
    diferencaAderencia: string;
    diferencaAderenciaPositiva: boolean;
  }>
): any => {
  const criarCardDia = (
    dia: { sigla: string; aderencia: number; horasEntregues: string },
    temDiferencas: boolean = false,
    diferencas?: {
      diferencaHoras: string;
      diferencaHorasPositiva: boolean;
      diferencaPercentualHoras: string;
      diferencaPercentualHorasPositiva: boolean;
      diferencaAderencia: string;
      diferencaAderenciaPositiva: boolean;
    }
  ) => {
    // Gráfico para cards diários - otimizado para altura
    const grafico = criarGraficoCircular(dia.aderencia, 72, 6);
    return {
      width: '*',
      stack: [
        {
          text: dia.sigla,
          fontSize: 14,
          bold: true,
          color: '#e5e7eb',
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          svg: grafico,
          width: 72,
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          stack: [
            {
              text: 'Horas Entregues',
              fontSize: 10,
              color: '#e5e7eb',
              alignment: 'center',
              margin: [0, 0, 0, 1],
            },
            {
              text: dia.horasEntregues,
              fontSize: 11,
              bold: true,
              color: COR_VERDE,
              alignment: 'center',
            },
          ],
          fillColor: [255, 255, 255, 0.10],
          borderRadius: 5,
          padding: [4, 3],
          margin: [2, 0, 2, 0],
        },
        ...(temDiferencas && diferencas
          ? [
              {
                stack: [
                  {
                    text: 'Diferenças',
                    fontSize: 10,
                    color: '#f3f4f6',
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaHoras,
                    fontSize: 12,
                    bold: true,
                    color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaPercentualHoras,
                    fontSize: 10,
                    bold: true,
                    color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: diferencas.diferencaAderencia,
                    fontSize: 9,
                    bold: true,
                    color: diferencas.diferencaAderenciaPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 5,
                padding: [4, 3],
                margin: [2, 2, 2, 0],
              },
            ]
          : []),
      ],
      fillColor: [255, 255, 255, 0.12],
      borderRadius: 8,
      padding: [4, 4],
      margin: [1, 0, 1, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA DIÁRIA',
        fontSize: 40,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 15, 0, 5],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 24,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 12],
      },
      {
        text: `SEMANA ${numeroSemana1}`,
        fontSize: 17,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 5,
        margin: [8, 0, 8, 12],
      },
      {
        text: `SEMANA ${numeroSemana2}`,
        fontSize: 17,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },
      {
        columns: semana2Dias.map((dia) =>
          criarCardDia(dia, true, {
            diferencaHoras: dia.diferencaHoras,
            diferencaHorasPositiva: dia.diferencaHorasPositiva,
            diferencaPercentualHoras: dia.diferencaPercentualHoras,
            diferencaPercentualHorasPositiva: dia.diferencaPercentualHorasPositiva,
            diferencaAderencia: dia.diferencaAderencia,
            diferencaAderenciaPositiva: dia.diferencaAderenciaPositiva,
          })
        ),
        columnGap: 5,
        margin: [8, 0, 8, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};

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

// Função para criar slide de demanda/rejeições
export const criarSlideDemandaRejeicoes = (
  numeroSemana1: string,
  numeroSemana2: string,
  itens: Array<{
    label: string;
    icone: string;
    semana1Valor: string;
    semana2Valor: string;
    variacaoValor: string;
    variacaoPositiva: boolean;
    variacaoPercentual: string;
    variacaoPercentualPositiva: boolean;
  }>
): any => {
  // Layout com 3 colunas: Semana 1 | Variações | Semana 2
  
  const conteudo = {
    stack: [
      {
        text: 'DEMANDA E REJEIÇÕES',
        fontSize: 48,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 18, 0, 10],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 26,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 22],
      },
      {
        columns: [
          // Coluna Semana 1
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana1}`,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 16,
                    bold: true,
                    color: '#e5e7eb',
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: item.semana1Valor,
                    fontSize: 32,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.12],
                borderRadius: 10,
                padding: [12, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
          // Coluna Variações (Centro)
          {
            width: 'auto',
            stack: [
              {
                text: 'VARIAÇÕES',
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 12,
                    color: '#d1d5db',
                    alignment: 'center',
                    margin: [0, 0, 0, 4],
                  },
                  {
                    text: item.variacaoValor,
                    fontSize: 24,
                    bold: true,
                    color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 3],
                  },
                  {
                    text: item.variacaoPercentual,
                    fontSize: 18,
                    bold: true,
                    color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 10,
                padding: [15, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
          // Coluna Semana 2
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana2}`,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 16,
                    bold: true,
                    color: '#e5e7eb',
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: item.semana2Valor,
                    fontSize: 32,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.12],
                borderRadius: 10,
                padding: [12, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
        ],
        columnGap: 18,
        margin: [12, 0, 12, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};

// Função para criar slide de origens (similar a sub-praças)
export const criarSlideOrigens = (
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
  // Reutilizar a mesma estrutura de sub-praças
  return criarSlideSubPracas(numeroSemana1, numeroSemana2, paginaAtual, totalPaginas, itens);
};

