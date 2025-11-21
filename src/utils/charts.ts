/**
 * Utilitários para gráficos Chart.js
 * Helpers para formatação, cálculos e geração de dados de gráficos
 */

// =================================================================================
// CONSTANTES
// =================================================================================

export const CHART_CONSTANTS = {
  // ⚠️ OTIMIZAÇÃO: Máximo de semanas em um ano (53 é o máximo possível)
  MAX_WEEKS: 53,
  MIN_Y_PADDING_PERCENT: 0.08,
  MAX_Y_PADDING_PERCENT: 0.05,
  MIN_Y_RANGE_FOR_PADDING: 0.01,
  ZERO_RANGE_MAX: 10,
  POINT_RADIUS_SEMANAL: [7, 6, 6, 5, 6] as number[],
  POINT_RADIUS_MENSAL: [10, 9, 9, 8, 9] as number[],
  BORDER_WIDTHS: [5, 4, 4, 3, 4] as number[],
  DASH_PATTERNS: [
    [], // Sólida
    [8, 4], // Tracejada média
    [15, 5], // Tracejada longa
    [], // Sólida
  ] as number[][],
  OPACITIES: [1.0, 0.95, 0.90, 1.0, 1.0] as number[],
  VISUAL_OFFSET_BASE_PERCENT: 0.05,
};

// =================================================================================
// FORMATAÇÃO
// =================================================================================

/**
 * Formata número com separador de milhar
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value) || !isFinite(value)) return '0';
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

/**
 * Formata número com casas decimais
 */
export function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value == null || isNaN(value) || !isFinite(value)) return '0,00';
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value == null || isNaN(value) || !isFinite(value)) return '0,0%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formata horas (recebe horas decimais e retorna formato HH:MM:SS)
 */
export function formatHours(
  value: number | null | undefined, 
  formatHMS: (hours: string | number) => string
): string {
  if (value == null || isNaN(value) || !isFinite(value)) return '00:00:00';
  return formatHMS(value);
}

/**
 * Formata valor para tooltip baseado no tipo de métrica
 */
export function formatTooltipValue(
  value: number | null | undefined,
  label: string,
  formatHMS: (hours: string | number) => string
): string {
  if (value == null || isNaN(value) || !isFinite(value)) return '0';
  
  if (label.includes('Horas')) {
    return formatHours(value, formatHMS);
  } else if (label.includes('UTR')) {
    return formatDecimal(value, 2);
  } else if (label.includes('Corridas')) {
    return `${formatNumber(value)} corridas`;
  } else if (label.includes('%') || label.includes('Aderência')) {
    return formatPercent(value);
  }
  
  return formatNumber(value);
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculateVariationPercent(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Formata variação percentual para tooltip
 */
export function formatVariation(variation: number | null): string {
  if (variation == null || isNaN(variation) || !isFinite(variation)) return '';
  const arrow = variation > 0 ? '📈' : variation < 0 ? '📉' : '➡️';
  const sign = variation > 0 ? '+' : '';
  return `${arrow} ${sign}${variation.toFixed(1)}% vs anterior`;
}

// =================================================================================
// CÁLCULO DE EIXO Y
// =================================================================================

export interface YAxisRange {
  min: number | undefined;
  max: number | undefined;
}

/**
 * Calcula o range do eixo Y baseado nos valores dos datasets
 */
export function calculateYAxisRange(
  datasets: Array<{ data: (number | null)[] }>,
  constants: typeof CHART_CONSTANTS = CHART_CONSTANTS
): YAxisRange {
  if (!datasets || datasets.length === 0) {
    return { min: undefined, max: undefined };
  }

  // Coletar todos os valores válidos
  const allValues: number[] = [];
  datasets.forEach(dataset => {
    if (dataset.data && Array.isArray(dataset.data)) {
      dataset.data.forEach((value: unknown) => {
        if (value != null && typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          allValues.push(value);
        }
      });
    }
  });

  if (allValues.length === 0) {
    return { min: undefined, max: undefined };
  }

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Caso 1: Todos os valores são zero
  if (maxValue === 0 && minValue === 0) {
    return {
      min: 0,
      max: constants.ZERO_RANGE_MAX,
    };
  }

  // Caso 2: Valores muito próximos (diferença < 1% do máximo)
  if (maxValue - minValue < maxValue * constants.MIN_Y_RANGE_FOR_PADDING && maxValue > 0) {
    const padding = Math.max(maxValue * 0.1, 1);
    return {
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
    };
  }

  // Caso 3: Range normal com padding
  const range = maxValue - minValue;
  const padding = range * constants.MIN_Y_PADDING_PERCENT;
  
  return {
    min: Math.max(0, minValue - padding),
    max: maxValue + padding,
  };
}

// =================================================================================
// GERAÇÃO DE LABELS
// =================================================================================

/**
 * Traduz nome do mês para português
 */
export function translateMonth(mesNome: string): string {
  const meses: Record<string, string> = {
    'January': 'Janeiro',
    'February': 'Fevereiro',
    'March': 'Março',
    'April': 'Abril',
    'May': 'Maio',
    'June': 'Junho',
    'July': 'Julho',
    'August': 'Agosto',
    'September': 'Setembro',
    'October': 'Outubro',
    'November': 'Novembro',
    'December': 'Dezembro',
    'January ': 'Janeiro',
    'February ': 'Fevereiro',
    'March ': 'Março',
    'April ': 'Abril',
    'May ': 'Maio',
    'June ': 'Junho',
    'July ': 'Julho',
    'August ': 'Agosto',
    'September ': 'Setembro',
    'October ': 'Outubro',
    'November ': 'Novembro',
    'December ': 'Dezembro',
  };
  return meses[mesNome] || mesNome;
}

/**
 * Gera labels para visualização mensal
 * ⚠️ OTIMIZAÇÃO: Gera todos os 12 meses do ano, mesmo que não tenham dados
 */
export function generateMonthlyLabels(
  dados: Array<{ mes: number; mes_nome?: string; ano: number }>
): string[] {
  // Gerar todos os 12 meses do ano
  const mesesCompletos = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return mesesCompletos.map(mes => translateMonth(mes));
}

/**
 * Gera labels para visualização semanal
 * ⚠️ OTIMIZAÇÃO: Gera todas as 53 semanas possíveis, mesmo que não tenham dados
 */
export function generateWeeklyLabels(
  dados: Array<{ semana: number; ano: number }>
): string[] {
  // Gerar todas as 53 semanas possíveis
  const semanasCompletas: string[] = [];
  for (let i = 1; i <= 53; i++) {
    semanasCompletas.push(`S${i.toString().padStart(2, '0')}`);
  }
  
  return semanasCompletas;
}

// =================================================================================
// ALINHAMENTO DE DADOS
// =================================================================================

/**
 * Alinha dados de um dataset com os labels base
 */
export function alignDatasetData(
  data: (number | null)[],
  dataLabels: string[],
  baseLabels: string[]
): (number | null)[] {
  if (dataLabels.length === baseLabels.length && 
      dataLabels.every((label, i) => label === baseLabels[i])) {
    return data;
  }

  const labelMap = new Map<string, number | null>();
  dataLabels.forEach((label, idx) => {
    const value = data[idx];
    labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
  });

  return baseLabels.map(label => {
    const value = labelMap.get(label);
    return value != null ? value : null;
  });
}

/**
 * Garante que o array de dados tem o mesmo tamanho dos labels
 */
export function padDatasetToMatchLabels(
  data: (number | null)[],
  targetLength: number
): (number | null)[] {
  if (data.length === targetLength) return data;
  
  if (data.length < targetLength) {
    return [...data, ...Array(targetLength - data.length).fill(null)];
  }
  
  return data.slice(0, targetLength);
}

/**
 * Normaliza valores do dataset (garante que são números válidos ou null)
 */
export function normalizeDatasetValues(data: (number | null)[]): (number | null)[] {
  return data.map((value: unknown) => {
    if (value == null || value === undefined) {
      return null;
    }
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue)) {
      return null;
    }
    return numValue;
  });
}

// =================================================================================
// AJUSTE DE CORES
// =================================================================================

/**
 * Ajusta opacidade de uma cor (suporta rgba, rgb e hex)
 */
export function adjustColorOpacity(color: string, newOpacity: number): string {
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${newOpacity})`);
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${newOpacity})`);
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
  }
  return color;
}

