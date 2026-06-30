import { formatarHorasParaHMS } from '@/utils/formatters';
import { formatTooltipValue, formatVariation, calculateVariationPercent } from '@/utils/charts';

const getRawValue = (context: any): number => {
    const dataIndex = context.dataIndex;
    const originalDataset = context.chart?.data?.datasets?.[context.datasetIndex];
    if (originalDataset && originalDataset.rawValues && originalDataset.rawValues[dataIndex] !== undefined) {
        const val = originalDataset.rawValues[dataIndex];
        return val !== null && val !== undefined ? Number(val) : 0;
    }
    const val = context.raw ?? context.parsed?.y ?? 0;
    return val !== null && val !== undefined ? Number(val) : 0;
};

const getPreviousRawValue = (context: any): number | null => {
    const dataIndex = context.dataIndex;
    if (dataIndex <= 0) return null;
    const originalDataset = context.chart?.data?.datasets?.[context.datasetIndex];
    if (originalDataset && originalDataset.rawValues && originalDataset.rawValues[dataIndex - 1] !== undefined) {
        const val = originalDataset.rawValues[dataIndex - 1];
        return val !== null && val !== undefined ? Number(val) : null;
    }
    const val = originalDataset?.data?.[dataIndex - 1];
    return val !== null && val !== undefined ? Number(val) : null;
};

export const evolucaoTooltip = (isSemanal: boolean, isDarkMode: boolean) => ({
    enabled: true,
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    titleColor: 'rgba(255, 255, 255, 1)',
    bodyColor: 'rgba(226, 232, 240, 1)',
    padding: 20,
    titleFont: { size: 16, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
    bodyFont: { size: 15, weight: '600' as const, family: "'Inter', 'system-ui', sans-serif" },
    borderColor: 'rgba(148, 163, 184, 0.5)',
    borderWidth: 2,
    cornerRadius: 12,
    displayColors: true,
    boxWidth: 14,
    boxHeight: 14,
    boxPadding: 6,
    usePointStyle: true,
    callbacks: {
        title: function (context: any) {
            const label = context[0]?.label || '';
            const icon = isSemanal ? '📊' : '📅';
            const prefix = isSemanal ? 'Semana' : 'Mês de';
            const cleanLabel = isSemanal ? label.replace('S', '') : label;
            return `${icon} ${prefix} ${cleanLabel}`;
        },
        label: function (context: any) {
            const datasetLabel = context.dataset?.label || '';
            const rawValue = getRawValue(context);
            const formattedValue = formatTooltipValue(rawValue, datasetLabel, formatarHorasParaHMS);
            return datasetLabel ? `${datasetLabel}: ${formattedValue}` : formattedValue;
        },
        afterLabel: function (context: any) {
            const dataIndex = context.dataIndex;
            if (dataIndex > 0) {
                const currentValue = getRawValue(context);
                const previousValue = getPreviousRawValue(context);
                const variation = calculateVariationPercent(currentValue, previousValue);
                return variation != null ? formatVariation(variation) : '';
            }
            return '';
        },
    },
});
