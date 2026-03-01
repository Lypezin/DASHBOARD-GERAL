import { formatNumber, formatPercent } from '@/utils/formatters';

export const handleCopyTable = (displayRows: any[]) => {
    if (displayRows.length === 0) return;

    // Data rows only (no headers, no totals)
    const rows = displayRows.map(row => [
        formatNumber(row.pedidos),
        formatNumber(row.drivers),
        formatNumber(row.sh),
        formatPercent(row.aderenciaMedia),
        formatNumber(row.utr, 2),
        formatPercent(row.aderencia),
        formatPercent(row.rejeite)
    ].join('\t'));

    const tableText = rows.join('\n');

    navigator.clipboard.writeText(tableText).then(() => {
        // Toast notification could be added here if needed, 
        // but the button inside ResumoFilters handles its own state for "Copied!"
    });
};
