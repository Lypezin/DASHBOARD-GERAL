import { CSSProperties } from 'react';

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const buildCircleTextStyle = (
  value: number,
  baseFontRem: number,
  minimumFontRem: number = 3.2
): CSSProperties => {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  const length = safeValue.toFixed(1).replace('.', '').length;
  const reduction = Math.max(0, length - 3) * 0.6;
  const fontSize = Math.max(minimumFontRem, baseFontRem - reduction);

  return {
    fontSize: `${fontSize}rem`,
    lineHeight: '1',
    letterSpacing: '0',
    whiteSpace: 'nowrap',
    display: 'block',
    textAlign: 'center',
    maxWidth: '90%',
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

