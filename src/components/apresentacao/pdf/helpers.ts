
import {
  A4_LANDSCAPE_HEIGHT,
  A4_LANDSCAPE_WIDTH,
  COR_PRIMARIA,
  COR_BACKGROUND,
  COR_BACKGROUND_CAPA,
  COR_TEXTO,
  COR_SUBTITULO,
  MARGEM_PADRAO,
  FONTE_TITULO,
  FONTE_SUBTITULO,
} from './constants';

// Função para criar retângulo de fundo (Azul para capa, Branco para outros)
const criarRetanguloFundo = (isCapa: boolean = false) => ({
  canvas: [
    {
      type: 'rect',
      x: 0,
      y: 0,
      w: A4_LANDSCAPE_WIDTH,
      h: A4_LANDSCAPE_HEIGHT,
      color: isCapa ? COR_BACKGROUND_CAPA : COR_BACKGROUND,
    },
  ],
  absolutePosition: { x: 0, y: 0 },
});

// Cabeçalho padrão para slides de conteúdo - Design Premium
const criarHeader = (titulo: string, subtitulo?: string) => {
  return {
    stack: [
      {
        columns: [
          {
            text: titulo.toUpperCase(),
            color: COR_PRIMARIA,
            fontSize: FONTE_TITULO,
            bold: true,
            width: '*',
            characterSpacing: 1,
          },
          subtitulo ? {
            text: subtitulo,
            color: COR_SUBTITULO,
            fontSize: 13,
            alignment: 'right',
            margin: [0, 6, 0, 0],
            width: 'auto',
          } : {},
        ],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: A4_LANDSCAPE_WIDTH - (MARGEM_PADRAO * 2),
            y2: 0,
            lineWidth: 3,
            lineColor: COR_PRIMARIA,
          },
        ],
        margin: [0, 12, 0, 20],
      },
    ],
    margin: [MARGEM_PADRAO, MARGEM_PADRAO, MARGEM_PADRAO, 0],
  };
};

// Rodapé padrão com data e paginação - Design Premium
const criarFooter = (numeroPagina?: number, totalPaginas?: number) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return {
    stack: [
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: A4_LANDSCAPE_WIDTH - (MARGEM_PADRAO * 2),
            y2: 0,
            lineWidth: 1,
            lineColor: '#e2e8f0',
          },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          {
            text: 'Relatório Gerado Automaticamente',
            color: '#94a3b8',
            fontSize: 9,
            width: '*',
            italics: true,
          },
          {
            text: dataAtual,
            color: '#64748b',
            fontSize: 9,
            width: 'auto',
            alignment: 'center',
            bold: true,
          },
          {
            text: numeroPagina && totalPaginas ? `Página ${numeroPagina} de ${totalPaginas}` : '',
            color: '#64748b',
            fontSize: 9,
            width: '*',
            alignment: 'right',
          },
        ],
      },
    ],
    absolutePosition: { x: MARGEM_PADRAO, y: A4_LANDSCAPE_HEIGHT - 45 },
  };
};

// Wrapper principal para slides
export const criarSlideComLayout = (
  conteudo: any,
  titulo?: string,
  subtitulo?: string,
  isCapa: boolean = false,
  numeroPagina?: number,
  totalPaginas?: number
) => {
  if (isCapa) {
    return {
      stack: [
        criarRetanguloFundo(true),
        conteudo,
      ],
    };
  }

  return {
    stack: [
      criarRetanguloFundo(false),
      titulo ? criarHeader(titulo, subtitulo) : {},
      {
        stack: [conteudo],
        margin: [MARGEM_PADRAO, 0, MARGEM_PADRAO, 0],
      },
      criarFooter(numeroPagina, totalPaginas),
    ],
  };
};

// Mantendo compatibilidade com código antigo
export const adicionarBackgroundAoSlide = (conteudo: any) => {
  return criarSlideComLayout(conteudo, undefined, undefined, true);
};

export const criarGraficoCircular = (
  porcentagem: number,
  tamanho: number = 150,
  strokeWidth: number = 20,
  corTexto: string = '#ffffff',
  corBarra: string = '#ffffff',
  corFundoBarra: string = 'rgba(255,255,255,0.25)'
): string => {
  const radius = (tamanho - strokeWidth) / 2;
  const center = tamanho / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (porcentagem / 100) * circumference;

  // Tamanho da fonte proporcional
  const fontSize = tamanho > 200 ? 48 : tamanho > 140 ? 28 : tamanho > 100 ? 22 : 16;

  return `
    <svg width="${tamanho}" height="${tamanho}" xmlns="http://www.w3.org/2000/svg">
      <!-- Barra de fundo -->
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="${corFundoBarra}"
        stroke-width="${strokeWidth}"
      />
      <!-- Barra de progresso -->
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="${corBarra}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 ${center} ${center})"
        stroke-linecap="round"
      />
      <!-- Texto percentual -->
      <text
        x="${center}"
        y="${center + fontSize * 0.35}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${corTexto}"
        font-size="${fontSize}"
        font-weight="bold"
        font-family="Arial, Helvetica, sans-serif"
      >${porcentagem.toFixed(1)}%</text>
    </svg>
  `;
};

// Caractere de seta para cima (compatível com pdfmake)
export const SETA_CIMA = '▲';

// Caractere de seta para baixo (compatível com pdfmake)
export const SETA_BAIXO = '▼';

// Função para obter seta baseada no valor positivo/negativo
export const obterSeta = (positivo: boolean): string => {
  return positivo ? SETA_CIMA : SETA_BAIXO;
};

// Função para criar texto com seta
export const criarTextoComSeta = (
  valor: string,
  positivo: boolean
): string => {
  const seta = obterSeta(positivo);
  return `${seta} ${valor}`;
};

