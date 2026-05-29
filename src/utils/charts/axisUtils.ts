
import { CHART_CONSTANTS } from '@/utils/chartConstants';

export interface YAxisRange {
    min: number | undefined;
    max: number | undefined;
}

// Fallback constants if not provided
const DEFAULT_CONSTANTS = {
    ZERO_RANGE_MAX: 10,
    MIN_Y_RANGE_FOR_PADDING: 0.01,
    MIN_Y_PADDING_PERCENT: 0.1
};

/**
 * Calcula o range do eixo Y baseado nos valores dos datasets
 */
export function calculateYAxisRange(
    datasets: Array<{ data: (number | null)[] }>,
    constants: {
        ZERO_RANGE_MAX: number;
        MIN_Y_RANGE_FOR_PADDING: number;
        MIN_Y_PADDING_PERCENT: number;
    } = DEFAULT_CONSTANTS
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
