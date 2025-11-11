import {
  A4_LANDSCAPE_HEIGHT,
  A4_LANDSCAPE_WIDTH,
  COR_PRIMARIA,
} from './constants';

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
export const adicionarBackgroundAoSlide = (conteudo: any) => {
  return {
    stack: [
      criarRetanguloFundo(),
      conteudo,
    ],
  };
};

// Função para criar gráfico circular como SVG
export const criarGraficoCircular = (
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
