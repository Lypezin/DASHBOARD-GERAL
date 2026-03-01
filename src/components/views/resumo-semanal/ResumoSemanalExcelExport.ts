import { loadXLSX } from '@/lib/xlsxClient';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { ResumoTableRow } from './ResumoTable';

export const handleExportExcelResumoSemanal = async (dados: ResumoTableRow[], dataAgregacao: string, showToast?: (t: { title: string, variant: 'success' | 'destructive' }) => void) => {
    if (!dados || dados.length === 0) {
        alert("Sem dados para exportar.");
        return;
    }

    const exportData = dados.map((row) => ({
        "Semana": row.semana_label || row.label,
        "Pedidos": row.pedidos,
        "Drivers": row.drivers,
        "SH": Number(row.sh.toFixed(2)),
        "Aderência Média (%)": Number(row.aderenciaMedia.toFixed(2)),
        "UTR": Number(row.utr.toFixed(2)),
        "Aderência (%)": Number(row.aderencia.toFixed(2)),
        "Rejeite (%)": Number(row.rejeite.toFixed(2)),
    }));

    const XLSX = await loadXLSX();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Setup columns width
    const colWidths = [
        { wch: 15 }, // Semana
        { wch: 10 }, // Pedidos
        { wch: 10 }, // Drivers
        { wch: 10 }, // SH
        { wch: 20 }, // Aderência Média (%)
        { wch: 10 }, // UTR
        { wch: 15 }, // Aderência (%)
        { wch: 15 }, // Rejeite (%)
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumo Semanal");

    const safeDate = dataAgregacao || new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Resumo_Semanal_${safeDate}.xlsx`);
};
