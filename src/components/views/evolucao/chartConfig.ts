import { CHART_CONSTANTS, adjustColorOpacity } from '@/utils/charts';

export const segundosParaHoras = (segundos: number): number => {
    return segundos / 3600;
};

/**
 * Obtém configuração de métrica
 * ⚠️ REFORMULAÇÃO: Garantir mapeamento correto por índice
 */
export const getMetricConfig = (
    metric: 'ofertadas' | 'aceitas' | 'completadas' | 'horas',
    baseLabels: string[],
    dadosPorLabel: Map<string, any>
) => {
    // ⚠️ CRÍTICO: Mapear dados na mesma ordem dos labels
    // baseLabels[0] -> data[0], baseLabels[1] -> data[1], etc.
    const mapData = (getValue: (d: any) => number | null): (number | null)[] => {
        const mappedData = baseLabels.map((label, index) => {
            const d = dadosPorLabel.get(label);
            if (d === null || d === undefined) {
                return null;
            }
            const value = getValue(d);
            if (value == null || value === undefined) {
                return null;
            }
            // ⚠️ CORREÇÃO: Converter para número de forma mais robusta (suporta string e number)
            const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            if (isNaN(numValue) || !isFinite(numValue)) {
                return null;
            }
            return numValue;
        });

        return mappedData;
    };

    switch (metric) {
        case 'horas':
            return {
                labels: baseLabels,
                data: mapData(d => {
                    // ⚠️ CORREÇÃO: Converter total_segundos de forma mais robusta (pode vir como string do Supabase)
                    const segundosRaw = (d as any).total_segundos;
                    const segundos = typeof segundosRaw === 'string' ? parseFloat(segundosRaw) : Number(segundosRaw) || 0;
                    return segundosParaHoras(segundos);
                }),
                label: '⏱️ Horas Trabalhadas',
                borderColor: 'rgba(251, 146, 60, 1)',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(251, 146, 60, 0.2)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(253, 186, 116, 0.5)');
                    gradient.addColorStop(0.3, 'rgba(251, 146, 60, 0.35)');
                    gradient.addColorStop(0.7, 'rgba(234, 88, 12, 0.15)');
                    gradient.addColorStop(1, 'rgba(194, 65, 12, 0.00)');
                    return gradient;
                },
                pointColor: 'rgb(251, 146, 60)',
                yAxisID: 'y',
                useUtrData: false,
            };
        case 'ofertadas':
            return {
                labels: baseLabels,
                data: mapData(d => {
                    // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
                    const value = (d as any).corridas_ofertadas ?? (d as any).ofertadas; // Fallback para 'ofertadas' se 'corridas_ofertadas' não existir
                    return typeof value === 'string' ? parseFloat(value) : value;
                }),
                label: '📢 Corridas Ofertadas',
                borderColor: 'rgba(139, 92, 246, 1)',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(139, 92, 246, 0.2)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.5)');
                    gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.35)');
                    gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.15)');
                    gradient.addColorStop(1, 'rgba(109, 40, 217, 0.00)');
                    return gradient;
                },
                pointColor: 'rgb(139, 92, 246)',
                yAxisID: 'y',
                useUtrData: false,
            };
        case 'aceitas':
            return {
                labels: baseLabels,
                data: mapData(d => {
                    // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
                    const value = (d as any).corridas_aceitas ?? (d as any).aceitas; // Fallback
                    return typeof value === 'string' ? parseFloat(value) : value;
                }),
                label: '✅ Corridas Aceitas',
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16, 185, 129, 0.2)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
                    gradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.35)');
                    gradient.addColorStop(0.7, 'rgba(5, 150, 105, 0.15)');
                    gradient.addColorStop(1, 'rgba(4, 120, 87, 0.00)');
                    return gradient;
                },
                pointColor: 'rgb(16, 185, 129)',
                yAxisID: 'y',
                useUtrData: false,
            };
        case 'completadas':
        default:
            return {
                labels: baseLabels,
                data: mapData(d => {
                    // ⚠️ CORREÇÃO: Garantir conversão correta (pode vir como string ou number)
                    // Tentar 'corridas_completadas', depois 'completadas', depois 'total_corridas'
                    const value = (d as any).corridas_completadas ?? (d as any).completadas ?? (d as any).total_corridas;
                    return typeof value === 'string' ? parseFloat(value) : value;
                }),
                label: '🚗 Corridas Completadas',
                borderColor: 'rgba(37, 99, 235, 1)',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(37, 99, 235, 0.2)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                    gradient.addColorStop(0.3, 'rgba(37, 99, 235, 0.35)');
                    gradient.addColorStop(0.7, 'rgba(30, 64, 175, 0.15)');
                    gradient.addColorStop(1, 'rgba(29, 78, 216, 0.00)');
                    return gradient;
                },
                pointColor: 'rgb(37, 99, 235)',
                yAxisID: 'y',
                useUtrData: false,
            };
    }
};

/**
 * Cria dados do gráfico
 * ⚠️ REFORMULAÇÃO COMPLETA: Garantir alinhamento perfeito
 */
export const createChartData = (
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>,
    baseLabels: string[],
    dadosPorLabel: Map<string, any>,
    isSemanal: boolean
) => {
    if (selectedMetrics.size === 0 || baseLabels.length === 0) {
        return {
            labels: [],
            datasets: [],
        };
    }

    const metricConfigs = Array.from(selectedMetrics)
        .map(metric => getMetricConfig(metric, baseLabels, dadosPorLabel))
        .filter(config => config !== null) as Array<{
            labels: string[];
            data: (number | null)[];
            label: string;
            borderColor: string;
            backgroundColor: any;
            pointColor: string;
            yAxisID: string;
            useUtrData: boolean;
        }>;

    if (metricConfigs.length === 0) {
        return {
            labels: [],
            datasets: [],
        };
    }

    // Calcular valor máximo global para offset visual
    let globalMaxValue = 0;
    metricConfigs.forEach(config => {
        if (config.yAxisID === 'y') {
            config.data.forEach(v => {
                if (v != null && v !== 0 && v > globalMaxValue) {
                    globalMaxValue = v;
                }
            });
        }
    });

    // Criar datasets
    const datasets = metricConfigs.map((config, index) => {
        // ⚠️ CRÍTICO: Os dados já vêm na ordem correta dos labels
        let data: (number | null)[] = [...config.data];

        // Garantir tamanho correto
        if (data.length !== baseLabels.length) {
            while (data.length < baseLabels.length) {
                data.push(null);
            }
            data = data.slice(0, baseLabels.length);
        }

        // Normalizar valores
        data = data.map(v => {
            if (v == null || v === undefined) return null;
            const num = Number(v);
            return isNaN(num) || !isFinite(num) ? null : num;
        });

        // Aplicar offset visual se necessário
        if (data.length > 0 && data.some(v => v != null) && config.yAxisID === 'y' && globalMaxValue > 0 && !config.label.includes('Horas')) {
            const baseOffset = globalMaxValue * CHART_CONSTANTS.VISUAL_OFFSET_BASE_PERCENT;
            const offsets = [0, baseOffset * 0.5, baseOffset];
            const offset = offsets[index] || 0;

            if (offset > 0) {
                data = data.map((value: number | null) => {
                    if (value == null || value === 0) return value;
                    return value + offset;
                });
            }
        }

        const order = index;
        const borderWidth = CHART_CONSTANTS.BORDER_WIDTHS[index] || 4;
        const pointRadius = isSemanal
            ? (CHART_CONSTANTS.POINT_RADIUS_SEMANAL[index] || 6)
            : (CHART_CONSTANTS.POINT_RADIUS_MENSAL[index] || 9);
        const dashPattern = CHART_CONSTANTS.DASH_PATTERNS[index] || [];
        const opacity = CHART_CONSTANTS.OPACITIES[index] || 1.0;

        const borderColorWithOpacity = adjustColorOpacity(config.borderColor, opacity);
        const pointColorWithOpacity = adjustColorOpacity(config.pointColor, opacity);

        return {
            label: config.label,
            data,
            borderColor: borderColorWithOpacity,
            backgroundColor: config.backgroundColor,
            yAxisID: config.yAxisID,
            type: 'line' as const,
            tension: 0.4,
            cubicInterpolationMode: 'monotone' as const,
            pointRadius: data.map((v: number | null) => v != null ? pointRadius : 0),
            pointHoverRadius: isSemanal ? 12 : 14,
            pointHitRadius: 35,
            pointBackgroundColor: pointColorWithOpacity,
            pointBorderColor: '#fff',
            pointBorderWidth: 4,
            pointHoverBackgroundColor: config.pointColor,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 6,
            pointStyle: 'circle' as const,
            borderWidth: borderWidth,
            borderDash: dashPattern,
            fill: false,
            spanGaps: true, // ⚠️ CORREÇÃO: true para conectar linhas mesmo com valores null (gaps)
            showLine: true,
            hidden: false,
            order: order,
            z: index,
            stack: undefined,
            stepped: false,
            segment: {
                borderColor: (ctx: any) => borderColorWithOpacity,
                borderWidth: borderWidth,
                borderDash: dashPattern,
            },
        };
    });

    return {
        labels: baseLabels, // ⚠️ CRÍTICO: Sempre retornar todos os labels na ordem correta
        datasets,
    };
};
