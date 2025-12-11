/**
 * Utilitários para formatação de valores
 */

/**
 * Calcula a porcentagem de um valor em relação ao total
 * @returns String formatada com 1 casa decimal e símbolo % (ex: "15.5%")
 */
export function calculatePercentage(value: number, total: number) {
    if (!total || total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
}
