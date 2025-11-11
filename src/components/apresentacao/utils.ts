import { CSSProperties } from 'react';

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Constrói estilos para texto dentro de gráficos circulares com auto-scaling robusto.
 * Previne overflow e garante centralização perfeita.
 * 
 * @param value - Valor numérico a ser exibido
 * @param baseFontRem - Tamanho base da fonte em rem
 * @param minimumFontRem - Tamanho mínimo da fonte em rem
 * @returns Objeto CSSProperties com estilos otimizados
 */
export const buildCircleTextStyle = (
  value: number,
  baseFontRem: number,
  minimumFontRem: number = 2.0
): CSSProperties => {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  const valueString = safeValue.toFixed(1);
  const length = valueString.replace('.', '').length;
  
  // Redução mais agressiva para valores longos
  const reduction = Math.max(0, length - 3) * 0.75;
  const fontSize = Math.max(minimumFontRem, baseFontRem - reduction);

  return {
    fontSize: `${fontSize}rem`,
    lineHeight: '1',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: '85%',
    margin: '0 auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
};

export const formatSignedInteger = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }
  const sign = value > 0 ? '+' : '−';
  return `${sign}${numberFormatter.format(Math.abs(Math.round(value)))}`;
};

export const formatSignedPercent = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '±0,0%';
  }
  const sign = value > 0 ? '+' : '−';
  return `${sign}${percentFormatter.format(Math.abs(value))}%`;
};

/**
 * Formata strings de tempo longas para exibição compacta.
 * Converte formatos como "20199:55:12" para "20.199h" para melhor visualização.
 * 
 * @param timeString - String de tempo no formato HH:MM:SS ou H:MM:SS
 * @returns String formatada de forma compacta
 */
export const formatCompactTime = (timeString: string): string => {
  if (!timeString || typeof timeString !== 'string') return '0h';
  
  const parts = timeString.split(':');
  if (parts.length < 2) return timeString;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours)) return timeString;
  
  // Se as horas são muito grandes (> 9999), use notação compacta com separador de milhar
  if (hours > 9999) {
    const hoursFormatted = new Intl.NumberFormat('pt-BR').format(hours);
    return `${hoursFormatted}h`;
  }
  
  // Se as horas são grandes (> 999), mostre apenas horas
  if (hours > 999) {
    return `${hours}h`;
  }
  
  // Para valores normais, mostre horas e minutos se relevante
  if (minutes > 0 && hours < 100) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  
  return `${hours}h`;
};

/**
 * Constrói estilos para textos de tempo/horas com auto-scaling.
 * Ajusta o tamanho da fonte baseado no comprimento da string.
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
  
  // Redução baseada no comprimento
  let fontSize = baseFontRem;
  if (length > 12) fontSize = baseFontRem * 0.6;
  else if (length > 10) fontSize = baseFontRem * 0.7;
  else if (length > 8) fontSize = baseFontRem * 0.8;
  else if (length > 6) fontSize = baseFontRem * 0.9;
  
  return {
    fontSize: `${fontSize}rem`,
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    display: 'block',
  };
};

