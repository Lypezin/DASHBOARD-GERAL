import { formatarHorasParaHMS } from '@/utils/formatters';
import { formatTooltipValue, formatVariation, calculateVariationPercent } from '@/utils/charts';

const getRawValue = (context: any): number => {
    const dataIndex = context.dataIndex;
    // Try rawValues from the original dataset config
    const ds = context.dataset;
    if (ds?.rawValues && ds.rawValues[dataIndex] != null) {
        return Number(ds.rawValues[dataIndex]) || 0;
    }
    // Fallback to parsed value
    return Number(context.parsed?.y) || 0;
};

const getPreviousRawValue = (context: any): number | null => {
    const dataIndex = context.dataIndex;
    if (dataIndex <= 0) return null;
    const ds = context.dataset;
    if (ds?.rawValues && ds.rawValues[dataIndex - 1] != null) {
        return Number(ds.rawValues[dataIndex - 1]);
    }
    if (ds?.data && ds.data[dataIndex - 1] != null) {
        return Number(ds.data[dataIndex - 1]);
    }
    return null;
};

/**
 * Custom external tooltip handler for Chart.js v4.
 * Renders an HTML tooltip instead of relying on the canvas tooltip,
 * which can silently fail under various conditions.
 */
function getOrCreateTooltipEl(chart: any): HTMLDivElement {
    let tooltipEl = chart.canvas.parentNode.querySelector('.chartjs-custom-tooltip') as HTMLDivElement | null;
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.classList.add('chartjs-custom-tooltip');
        tooltipEl.style.cssText = `
            position: absolute;
            pointer-events: none;
            background: rgba(15, 23, 42, 0.97);
            border: 2px solid rgba(148, 163, 184, 0.5);
            border-radius: 12px;
            padding: 16px 20px;
            color: rgba(226, 232, 240, 1);
            font-family: 'Inter', 'system-ui', sans-serif;
            font-size: 14px;
            font-weight: 600;
            transition: opacity 0.15s ease, left 0.1s ease, top 0.1s ease;
            z-index: 9999;
            max-width: 360px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        `;
        chart.canvas.parentNode.style.position = 'relative';
        chart.canvas.parentNode.appendChild(tooltipEl);
    }
    return tooltipEl;
}

function externalTooltipHandler(isSemanal: boolean) {
    return function (context: any) {
        const { chart, tooltip } = context;
        const tooltipEl = getOrCreateTooltipEl(chart);

        // Hide if no tooltip
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        // Build title
        const titleLines = tooltip.title || [];
        let titleHtml = '';
        if (titleLines.length > 0) {
            const rawLabel = titleLines[0] || '';
            const icon = isSemanal ? '📊' : '📅';
            const prefix = isSemanal ? 'Semana' : 'Mês de';
            const cleanLabel = isSemanal ? rawLabel.replace('S', '') : rawLabel;
            titleHtml = `<div style="font-size:15px;font-weight:bold;color:white;margin-bottom:10px">${icon} ${prefix} ${cleanLabel}</div>`;
        }

        // Build body lines
        let bodyHtml = '';
        if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
            for (const dp of tooltip.dataPoints) {
                const datasetLabel = dp.dataset?.label || '';
                const rawValue = getRawValue(dp);
                const formattedValue = formatTooltipValue(rawValue, datasetLabel, formatarHorasParaHMS);
                const color = dp.dataset?.borderColor || '#3b82f6';

                // Variation line
                let variationHtml = '';
                if (dp.dataIndex > 0) {
                    const prevValue = getPreviousRawValue(dp);
                    const variation = calculateVariationPercent(rawValue, prevValue);
                    if (variation != null) {
                        variationHtml = `<div style="font-size:11px;opacity:0.7;margin-left:20px;margin-top:1px">${formatVariation(variation)}</div>`;
                    }
                }

                bodyHtml += `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0"></span>
                        <span>${datasetLabel ? `${datasetLabel}: ` : ''}${formattedValue}</span>
                    </div>
                    ${variationHtml}
                `;
            }
        }

        tooltipEl.innerHTML = titleHtml + bodyHtml;

        // Position
        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
        const tooltipWidth = tooltipEl.offsetWidth;
        const canvasWidth = chart.canvas.offsetWidth;

        let left = positionX + tooltip.caretX + 12;
        // If tooltip would overflow right, flip to left side
        if (left + tooltipWidth > positionX + canvasWidth - 10) {
            left = positionX + tooltip.caretX - tooltipWidth - 12;
        }
        // Clamp to left edge
        if (left < positionX + 4) {
            left = positionX + 4;
        }

        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = positionY + tooltip.caretY - 20 + 'px';
    };
}

export const evolucaoTooltip = (isSemanal: boolean, _isDarkMode: boolean) => ({
    enabled: false,
    external: externalTooltipHandler(isSemanal),
});
