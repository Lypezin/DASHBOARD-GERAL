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
