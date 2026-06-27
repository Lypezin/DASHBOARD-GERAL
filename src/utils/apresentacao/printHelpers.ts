/**
 * Funções utilitárias para processamento de dados de impressão
 * Extraído de src/app/apresentacao/print/page.tsx
 */

export {
  chunkArray,
  diasOrdem,
  extrairNumeroSemana,
  siglaDia,
} from './processors/common';

export function formatSigned(percentOrInt: number, suffix = '%') {
  if (!Number.isFinite(percentOrInt) || percentOrInt === 0) return suffix === '%' ? '±0,0%' : '0';
  const sign = percentOrInt > 0 ? '+' : '−';
  const value = Math.abs(percentOrInt);
  if (suffix === '%') {
    return `${sign}${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
  }
  return `${sign}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function formatHMS(hoursString: string): string {
  const parts = String(hoursString).split(':');
  if (parts.length !== 3) return hoursString;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
}

export const SUB_PRACAS_PER_PAGE = 4;
export const TURNOS_PER_PAGE = 3;
export const ORIGENS_PER_PAGE = 4;

