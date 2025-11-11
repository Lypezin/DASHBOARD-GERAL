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
const adicionarBackgroundAoSlide = (conteudo: any) => ({
  stack: [
    criarRetanguloFundo(),
    {
      ...conteudo,
      relativePosition: { x: 0, y: 0 },
    },
  ],
});

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
  const grafico1 = criarGraficoCircular(semana1.aderencia, 300);
  const grafico2 = criarGraficoCircular(semana2.aderencia, 300);

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA GERAL',
        fontSize: 64,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 40, 0, 10],
      },
      {
        text: `SEMANAS ${semana1.numeroSemana} & ${semana2.numeroSemana}`,
        fontSize: 32,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
        margin: [0, 0, 0, 40],
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
                alignment: 'center',
                margin: [0, 0, 0, 20],
              },
              {
                text: `${semana1.aderencia.toFixed(1)}%`,
                fontSize: 48,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, -240, 0, 20],
              },
              {
                stack: [
                  {
                    text: '🎯 Planejado',
                    fontSize: 22,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana1.horasPlanejadas,
                    fontSize: 28,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                margin: [20, 0, 20, 10],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [15, 10],
              },
              {
                stack: [
                  {
                    text: '✅ Entregue',
                    fontSize: 22,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana1.horasEntregues,
                    fontSize: 28,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                margin: [20, 0, 20, 0],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [15, 10],
              },
            ],
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
                alignment: 'center',
                margin: [0, 0, 0, 20],
              },
              {
                text: `${semana2.aderencia.toFixed(1)}%`,
                fontSize: 48,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, -240, 0, 20],
              },
              {
                stack: [
                  {
                    text: '🎯 Planejado',
                    fontSize: 22,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana2.horasPlanejadas,
                    fontSize: 28,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                margin: [20, 0, 20, 10],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [15, 10],
              },
              {
                stack: [
                  {
                    text: '✅ Entregue',
                    fontSize: 22,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: semana2.horasEntregues,
                    fontSize: 28,
                    bold: true,
                    color: COR_VERDE,
                    alignment: 'center',
                  },
                ],
                margin: [20, 0, 20, 10],
                fillColor: [255, 255, 255, 0.15], // Branco com 15% de opacidade
                borderRadius: 8,
                padding: [15, 10],
              },
              {
                stack: [
                  {
                    text: 'Variação de Horas',
                    fontSize: 20,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: variacao.horasDiferenca,
                    fontSize: 28,
                    bold: true,
                    color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                  {
                    text: variacao.horasPercentual,
                    fontSize: 20,
                    bold: true,
                    color: variacao.positiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                margin: [20, 0, 20, 0],
                fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                borderRadius: 8,
                padding: [15, 10],
              },
            ],
          },
        ],
        columnGap: 40,
        margin: [40, 0, 40, 0],
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
    const grafico = criarGraficoCircular(dia.aderencia, 100, 8);
    return {
      width: '*',
      stack: [
        {
          text: dia.sigla,
          fontSize: 18,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 8],
          opacity: 0.85,
        },
        {
          svg: grafico,
          alignment: 'center',
          margin: [0, 0, 0, 8],
        },
        {
          text: `${dia.aderencia.toFixed(1)}%`,
          fontSize: 20,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, -80, 0, 8],
        },
        {
          stack: [
            {
              text: 'Horas Entregues',
              fontSize: 13,
              color: COR_TEXTO,
              alignment: 'center',
              margin: [0, 0, 0, 3],
              opacity: 0.85,
            },
            {
              text: dia.horasEntregues,
              fontSize: 14,
              bold: true,
              color: COR_VERDE,
              alignment: 'center',
            },
          ],
          fillColor: 'rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding: [8, 5],
          margin: [5, 0, 5, 0],
        },
        ...(temDiferencas && diferencas
          ? [
              {
                stack: [
                  {
                    text: 'Diferenças',
                    fontSize: 14,
                    color: '#f3f4f6', // Cor mais clara para simular opacity
                    alignment: 'center',
                    margin: [0, 0, 0, 3],
                  },
                  {
                    text: diferencas.diferencaHoras,
                    fontSize: 16,
                    bold: true,
                    color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                  {
                    text: diferencas.diferencaPercentualHoras,
                    fontSize: 13,
                    bold: true,
                    color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                  {
                    text: diferencas.diferencaAderencia,
                    fontSize: 12,
                    bold: true,
                    color: diferencas.diferencaAderenciaPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                borderRadius: 8,
                padding: [8, 5],
                margin: [5, 5, 5, 0],
              },
            ]
          : []),
      ],
      fillColor: [255, 255, 255, 0.12], // Branco com 12% de opacidade
      borderRadius: 12,
      padding: [10, 8],
      margin: [3, 0, 3, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA DIÁRIA',
        fontSize: 50,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 30, 0, 5],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 28,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
        margin: [0, 0, 0, 30],
      },
      {
        text: `SEMANA ${numeroSemana1}`,
        fontSize: 22,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 15],
      },
      {
        columns: semana1Dias.map((dia) => criarCardDia(dia)),
        columnGap: 8,
        margin: [20, 0, 20, 30],
      },
      {
        text: `SEMANA ${numeroSemana2}`,
        fontSize: 22,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 0, 0, 15],
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
        columnGap: 8,
        margin: [20, 0, 20, 0],
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
    const grafico1 = criarGraficoCircular(turno.semana1.aderencia, 180, 12);
    const grafico2 = criarGraficoCircular(turno.semana2.aderencia, 180, 12);

    return {
      width: '*',
      stack: [
        {
          text: turno.nome,
          fontSize: 25,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana1}`,
                  fontSize: 18,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico1,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: `${turno.semana1.aderencia.toFixed(1)}%`,
                  fontSize: 22,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, -140, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 16,
                      color: '#f3f4f6', // Cor mais clara para simular opacity
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: turno.semana1.horasEntregues,
                      fontSize: 19,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                  borderRadius: 8,
                  padding: [10, 8],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana2}`,
                  fontSize: 18,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico2,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: `${turno.semana2.aderencia.toFixed(1)}%`,
                  fontSize: 22,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, -140, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 16,
                      color: '#f3f4f6', // Cor mais clara para simular opacity
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: turno.semana2.horasEntregues,
                      fontSize: 19,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                  borderRadius: 8,
                  padding: [10, 8],
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
                color: '#d1d5db', // Cor mais clara para simular opacity
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
            fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
            borderRadius: 8,
            padding: [10, 8],
            margin: [2, 0, 2, 0],
          })),
          columnGap: 5,
        },
      ],
      fillColor: [255, 255, 255, 0.12], // Branco com 12% de opacidade
      borderRadius: 16,
      padding: [20, 15],
      margin: [5, 0, 5, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'ADERÊNCIA POR TURNO',
        fontSize: 55,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 30, 0, 5],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 32,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
        margin: [0, 0, 0, 5],
      },
      ...(totalPaginas > 1
        ? [
            {
              text: `Página ${paginaAtual} de ${totalPaginas}`,
              fontSize: 22,
              color: '#e5e7eb', // Cor mais clara para simular opacity
              alignment: 'center',
              margin: [0, 0, 0, 30],
            },
          ]
        : [{ text: '', margin: [0, 0, 0, 30] }]),
      {
        columns: itens.map((turno) => criarCardTurno(turno)),
        columnGap: 20,
        margin: [30, 0, 30, 0],
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
    const grafico1 = criarGraficoCircular(item.semana1.aderencia, 200, 16);
    const grafico2 = criarGraficoCircular(item.semana2.aderencia, 200, 16);

    return {
      width: '*',
      stack: [
        {
          text: item.nome,
          fontSize: 25,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 15],
        },
        {
          stack: [
            {
              text: '🎯 Planejado',
              fontSize: 20,
              color: COR_TEXTO,
              alignment: 'center',
              margin: [0, 0, 0, 5],
              opacity: 0.85,
            },
            {
              text: item.horasPlanejadas,
              fontSize: 24,
              bold: true,
              color: COR_AZUL_CLARO,
              alignment: 'center',
            },
          ],
          fillColor: [255, 255, 255, 0.12], // Branco com 12% de opacidade
          borderRadius: 8,
          padding: [12, 10],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana1}`,
                  fontSize: 18,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico1,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: `${item.semana1.aderencia.toFixed(1)}%`,
                  fontSize: 32,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, -160, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 16,
                      color: '#f3f4f6', // Cor mais clara para simular opacity
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: item.semana1.horasEntregues,
                      fontSize: 18,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                  borderRadius: 8,
                  padding: [10, 8],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana2}`,
                  fontSize: 18,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  svg: grafico2,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: `${item.semana2.aderencia.toFixed(1)}%`,
                  fontSize: 32,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, -160, 0, 10],
                },
                {
                  stack: [
                    {
                      text: 'Horas Entregues',
                      fontSize: 16,
                      color: '#f3f4f6', // Cor mais clara para simular opacity
                      alignment: 'center',
                      margin: [0, 0, 0, 3],
                    },
                    {
                      text: item.semana2.horasEntregues,
                      fontSize: 18,
                      bold: true,
                      color: COR_VERDE,
                      alignment: 'center',
                    },
                  ],
                  fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
                  borderRadius: 8,
                  padding: [10, 8],
                },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 15],
        },
        {
          columns: item.variacoes.map((variacao) => ({
            width: '*',
            stack: [
              {
                text: variacao.label,
                fontSize: 14,
                color: '#d1d5db', // Cor mais clara para simular opacity
                alignment: 'center',
                margin: [0, 0, 0, 3],
              },
              {
                text: variacao.valor,
                fontSize: 16,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: [255, 255, 255, 0.10], // Branco com 10% de opacidade
            borderRadius: 8,
            padding: [10, 8],
            margin: [2, 0, 2, 0],
          })),
          columnGap: 5,
        },
      ],
      fillColor: [255, 255, 255, 0.12], // Branco com 12% de opacidade
      borderRadius: 18,
      padding: [25, 20],
      margin: [5, 0, 5, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'SUB-PRAÇAS',
        fontSize: 55,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 30, 0, 5],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 32,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
        margin: [0, 0, 0, 5],
      },
      ...(totalPaginas > 1
        ? [
            {
              text: `Página ${paginaAtual} de ${totalPaginas}`,
              fontSize: 20,
              color: '#e5e7eb', // Cor mais clara para simular opacity
              alignment: 'center',
              margin: [0, 0, 0, 30],
            },
          ]
        : [{ text: '', margin: [0, 0, 0, 30] }]),
      {
        columns: itens.map((item) => criarCardSubPraca(item)),
        columnGap: 25,
        margin: [30, 0, 30, 0],
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
  const criarCardDemanda = (item: typeof itens[0]) => {
    return {
      width: '*',
      stack: [
        {
          text: `${item.icone} ${item.label}`,
          fontSize: 24,
          bold: true,
          color: COR_TEXTO,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana1}`,
                  fontSize: 18,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                  opacity: 0.85,
                },
                {
                  text: item.semana1Valor,
                  fontSize: 32,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: `SEM ${numeroSemana2}`,
                  fontSize: 18,
                  color: COR_TEXTO,
                  alignment: 'center',
                  margin: [0, 0, 0, 10],
                  opacity: 0.85,
                },
                {
                  text: item.semana2Valor,
                  fontSize: 32,
                  bold: true,
                  color: COR_TEXTO,
                  alignment: 'center',
                },
              ],
            },
          ],
          columnGap: 15,
          margin: [0, 0, 0, 15],
        },
        {
          stack: [
            {
              text: item.variacaoValor,
              fontSize: 28,
              bold: true,
              color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
              alignment: 'center',
            },
            {
              text: item.variacaoPercentual,
              fontSize: 20,
              bold: true,
              color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
              alignment: 'center',
            },
          ],
          fillColor: 'rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding: [12, 10],
        },
      ],
      fillColor: [255, 255, 255, 0.12], // Branco com 12% de opacidade
      borderRadius: 16,
      padding: [20, 15],
      margin: [5, 0, 5, 0],
    };
  };

  const conteudo = {
    stack: [
      {
        text: 'DEMANDA E REJEIÇÕES',
        fontSize: 55,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 50, 0, 10],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 32,
        color: '#e5e7eb', // Cor mais clara para simular opacity
        alignment: 'center',
        margin: [0, 0, 0, 50],
      },
      {
        columns: itens.map((item) => criarCardDemanda(item)),
        columnGap: 20,
        margin: [40, 0, 40, 0],
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

