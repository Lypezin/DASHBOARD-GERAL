
import { CSSProperties } from 'react';

/**
 * Constrói estilos para texto dentro de gráficos circulares.
 * Design minimalista e profissional - sempre centralizado, nunca overflow.
 * 
 * @param value - Valor numérico a ser exibido
 * @param baseFontRem - Tamanho base da fonte em rem
 * @param minimumFontRem - Tamanho mínimo da fonte em rem (não usado, mantido para compatibilidade)
 * @returns Objeto CSSProperties com estilos otimizados
 */
export const buildCircleTextStyle = (
    value: number,
    baseFontRem: number,
    minimumFontRem: number = 0.7
): CSSProperties => {
    // Simples e direto: escala baseada no valor para manter proporcionalidade
    const safeValue = Number.isFinite(value) ? value : 0;

    // Para valores >= 100, reduzir fonte para caber
    let fontSize = baseFontRem;
    if (safeValue >= 100) {
        fontSize = baseFontRem * 0.85;
    } else if (safeValue >= 10) {
        fontSize = baseFontRem * 0.95;
    }

    // Garantir mínimo legível
    fontSize = Math.max(minimumFontRem, fontSize);

    return {
        fontSize: `${fontSize}rem`,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontWeight: 900,
        color: 'inherit',
    } as CSSProperties;
};

/**
 * Constrói estilos para textos de tempo/horas com auto-scaling.
 * Ajusta o tamanho da fonte baseado no comprimento da string.
 * Otimizado para renderização em PDF sem distorção.
 * 
 * @param timeString - String de tempo
 * @param baseFontRem - Tamanho base da fonte em rem
 * @returns Objeto CSSProperties com estilos otimizados
 */
export const buildTimeTextStyle = (
    timeString: string,
    baseFontRem: number = 2.8
): CSSProperties => {
    const length = timeString?.length || 0;

    // Redução progressiva mais suave
    let fontSize = baseFontRem;
    if (length > 13) {
        fontSize = baseFontRem * 0.55;
    } else if (length > 12) {
        fontSize = baseFontRem * 0.65;
    } else if (length > 10) {
        fontSize = baseFontRem * 0.75;
    } else if (length > 8) {
        fontSize = baseFontRem * 0.85;
    } else if (length > 6) {
        fontSize = baseFontRem * 0.92;
    }

    return {
        fontSize: `${fontSize}rem`,
        lineHeight: '1.2',
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
        display: 'block',
        textAlign: 'inherit',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        fontWeight: '700',
        color: 'inherit',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
    };
};
