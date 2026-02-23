import * as XLSX from 'xlsx';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { ResumoTableRow } from './ResumoTable';

export const exportarResumoSemanalParaExcel = (displayRows: ResumoTableRow[]) => {
    if (!displayRows || displayRows.length === 0) {
        alert("Sem dados para exportar.");
        return;
    }

    const exportData = displayRows.map((row) => ({
        "Semana": row.semana_label || row.label,
        "Pedidos": row.pedidos,
        "Drivers": row.drivers,
        "SH": Number(row.sh.toFixed(2)),
        "Aderência Média (%)": Number(row.aderenciaMedia.toFixed(2)),
        "UTR": Number(row.utr.toFixed(2)),
        "Aderência (%)": Number(row.aderencia.toFixed(2)),
        "Rejeite (%)": Number(row.rejeite.toFixed(2)),
    }));

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
    
    const dataAgregacao = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Resumo_Semanal_${dataAgregacao}.xlsx`);
};
