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

    const fontSize = tamanho > 200 ? 48 : tamanho > 140 ? 28 : tamanho > 100 ? 22 : 16;

    return `
    <svg width="${tamanho}" height="${tamanho}" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="${corFundoBarra}"
        stroke-width="${strokeWidth}"
      />
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

export const SETA_CIMA = '▲';
export const SETA_BAIXO = '▼';

export const obterSeta = (positivo: boolean): string => {
    return positivo ? SETA_CIMA : SETA_BAIXO;
};

export const criarTextoComSeta = (
    valor: string,
    positivo: boolean
): string => {
    const seta = obterSeta(positivo);
    return `${seta} ${valor}`;
};
