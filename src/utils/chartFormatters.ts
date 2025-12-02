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
