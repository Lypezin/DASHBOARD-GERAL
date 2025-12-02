import { CHART_CONSTANTS } from './chartConstants';

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
