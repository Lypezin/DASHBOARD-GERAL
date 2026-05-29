import { formatarHorasParaHMS } from '@/utils/formatters';
import { formatTooltipValue, formatVariation, calculateVariationPercent } from '@/utils/charts';

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
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            const formattedValue = formatTooltipValue(value, datasetLabel, formatarHorasParaHMS);
            return datasetLabel ? `${datasetLabel}: ${formattedValue}` : formattedValue;
        },
        afterLabel: function (context: any) {
            const dataIndex = context.dataIndex;
            if (dataIndex > 0) {
                const currentValue = context.parsed.y;
                const previousValue = context.dataset.data[dataIndex - 1];
                const variation = calculateVariationPercent(currentValue, previousValue);
                return variation != null ? formatVariation(variation) : '';
            }
            return '';
        },
    },
});
